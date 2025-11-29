import { CodebaseConfig, GeneratedModule, GeneratedCodebase } from '@/types/config';

const CVE_PATTERNS = {
  buffer_overflow: `
  // CVE-XXXX-XXXX: Potential buffer overflow vulnerability
  char buffer[256];
  strcpy(buffer, input); // No bounds checking`,
  
  use_after_free: `
  // CVE-XXXX-XXXX: Use after free vulnerability
  free(ptr);
  return ptr->data; // Accessing freed memory`,
  
  null_pointer: `
  // CVE-XXXX-XXXX: Null pointer dereference
  if (ptr == NULL) {
    // Should return here but doesn't
  }
  return ptr->value;`,
  
  integer_overflow: `
  // CVE-XXXX-XXXX: Integer overflow vulnerability
  int result = a * b; // No overflow check
  malloc(result);`,
};

export function generateRandomDependencies(
  moduleIndex: number,
  totalModules: number,
  complexity: 'low' | 'medium' | 'high'
): number[] {
  const dependencies: number[] = [];
  const maxDeps = complexity === 'low' ? 2 : complexity === 'medium' ? 5 : 8;
  const numDeps = Math.floor(Math.random() * maxDeps);
  
  for (let i = 0; i < numDeps; i++) {
    const dep = Math.floor(Math.random() * moduleIndex);
    if (!dependencies.includes(dep) && dep !== moduleIndex) {
      dependencies.push(dep);
    }
  }
  
  return dependencies;
}

export function generateHeaderContent(
  moduleName: string,
  includeVuln: boolean
): string {
  const guard = `${moduleName.toUpperCase()}_H`;
  
  return `#ifndef ${guard}
#define ${guard}

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Module: ${moduleName}
// Generated for SBOM/CVE testing

typedef struct ${moduleName}_context {
    int initialized;
    void* data;
    size_t data_size;
} ${moduleName}_context_t;

// Public API
int ${moduleName}_init(${moduleName}_context_t* ctx);
int ${moduleName}_process(${moduleName}_context_t* ctx, const char* input);
int ${moduleName}_cleanup(${moduleName}_context_t* ctx);
${includeVuln ? `int ${moduleName}_vulnerable_function(char* input);` : ''}

#endif // ${guard}
`;
}

export function generateSourceContent(
  moduleName: string,
  dependencies: string[],
  targetLines: number,
  includeVuln: boolean
): string {
  let content = `#include "${moduleName}.h"\n`;
  
  // Add dependency includes
  dependencies.forEach(dep => {
    content += `#include "${dep}.h"\n`;
  });
  
  content += `\n// Implementation for ${moduleName}\n\n`;
  
  // Init function
  content += `int ${moduleName}_init(${moduleName}_context_t* ctx) {
    if (ctx == NULL) {
        return -1;
    }
    
    ctx->initialized = 1;
    ctx->data = malloc(1024);
    ctx->data_size = 1024;
    
    if (ctx->data == NULL) {
        return -1;
    }
    
    return 0;
}\n\n`;

  // Process function
  content += `int ${moduleName}_process(${moduleName}_context_t* ctx, const char* input) {
    if (ctx == NULL || !ctx->initialized) {
        return -1;
    }
    
    if (input == NULL) {
        return -1;
    }
    
    // Process input data
    size_t len = strlen(input);
    if (len > ctx->data_size) {
        void* new_data = realloc(ctx->data, len + 1);
        if (new_data == NULL) {
            return -1;
        }
        ctx->data = new_data;
        ctx->data_size = len + 1;
    }
    
    memcpy(ctx->data, input, len + 1);
    
    return 0;
}\n\n`;

  // Cleanup function
  content += `int ${moduleName}_cleanup(${moduleName}_context_t* ctx) {
    if (ctx == NULL) {
        return -1;
    }
    
    if (ctx->data != NULL) {
        free(ctx->data);
        ctx->data = NULL;
    }
    
    ctx->initialized = 0;
    ctx->data_size = 0;
    
    return 0;
}\n\n`;

  // Add vulnerable function if requested
  if (includeVuln) {
    const vulnType = Object.keys(CVE_PATTERNS)[
      Math.floor(Math.random() * Object.keys(CVE_PATTERNS).length)
    ] as keyof typeof CVE_PATTERNS;
    
    content += `int ${moduleName}_vulnerable_function(char* input) {
${CVE_PATTERNS[vulnType]}
    return 0;
}\n\n`;
  }
  
  // Add padding functions to reach target line count
  const currentLines = content.split('\n').length;
  const remainingLines = targetLines - currentLines;
  
  if (remainingLines > 0) {
    const numHelpers = Math.ceil(remainingLines / 15);
    for (let i = 0; i < numHelpers; i++) {
      content += `static int ${moduleName}_helper_${i}(int param) {
    // Helper function ${i}
    int result = param * 2;
    result += ${i};
    
    if (result > 100) {
        result = result % 100;
    }
    
    return result;
}\n\n`;
    }
  }
  
  return content;
}

export function generateMakefile(modules: GeneratedModule[]): string {
  let makefile = `# Generated Makefile for SBOM/CVE testing
CC = gcc
CFLAGS = -Wall -Wextra -I.
LDFLAGS =

OBJECTS = ${modules.map(m => `${m.name}.o`).join(' ')}

all: test_program

test_program: $(OBJECTS) main.o
\t$(CC) $(LDFLAGS) -o $@ $^

`;

  modules.forEach(m => {
    makefile += `${m.name}.o: ${m.name}.c ${m.name}.h`;
    if (m.dependencies.length > 0) {
      makefile += ` ${m.dependencies.map(d => `${d}.h`).join(' ')}`;
    }
    makefile += `\n\t$(CC) $(CFLAGS) -c $<\n\n`;
  });

  makefile += `main.o: main.c\n\t$(CC) $(CFLAGS) -c $<\n\n`;
  makefile += `clean:\n\trm -f *.o test_program\n\n`;
  makefile += `.PHONY: all clean\n`;

  return makefile;
}

export function generateCMakeLists(config: CodebaseConfig, modules: GeneratedModule[]): string {
  return `cmake_minimum_required(VERSION 3.10)
project(${config.name} C)

set(CMAKE_C_STANDARD 11)
set(CMAKE_C_FLAGS "\${CMAKE_C_FLAGS} -Wall -Wextra")

# Source files
set(SOURCES
    main.c
${modules.map(m => `    ${m.name}.c`).join('\n')}
)

# Create executable
add_executable(test_program \${SOURCES})

# Include directories
target_include_directories(test_program PRIVATE \${CMAKE_CURRENT_SOURCE_DIR})
`;
}

export function generateMainC(modules: GeneratedModule[]): string {
  let content = `#include <stdio.h>\n`;
  modules.forEach(m => {
    content += `#include "${m.name}.h"\n`;
  });
  
  content += `\nint main(int argc, char* argv[]) {
    printf("Test program for SBOM/CVE analysis\\n");
    printf("Compiled with %d modules\\n", ${modules.length});
    
`;

  modules.forEach(m => {
    content += `    {
        ${m.name}_context_t ctx;
        if (${m.name}_init(&ctx) == 0) {
            printf("Module ${m.name} initialized\\n");
            ${m.name}_process(&ctx, "test input");
            ${m.name}_cleanup(&ctx);
        }
    }
    
`;
  });

  content += `    return 0;
}\n`;

  return content;
}

export function generateSBOM(config: CodebaseConfig, modules: GeneratedModule[]): any {
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.4",
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: {
        name: config.name,
        version: "1.0.0",
        type: "application"
      }
    },
    components: modules.map(m => ({
      type: "library",
      name: m.name,
      version: "1.0.0",
      description: `Generated module for testing`,
      licenses: [{ license: { id: "MIT" } }],
      dependencies: m.dependencies.map(d => ({ ref: d }))
    }))
  };
}

export function generateCodebase(config: CodebaseConfig): GeneratedCodebase {
  const modules: GeneratedModule[] = [];
  
  for (let i = 0; i < config.totalModules; i++) {
    const moduleName = `module_${String(i).padStart(4, '0')}`;
    const deps = generateRandomDependencies(i, config.totalModules, config.dependencyComplexity);
    const depNames = deps.map(d => `module_${String(d).padStart(4, '0')}`);
    
    const targetLines = Math.floor(
      Math.random() * (config.linesPerFile.max - config.linesPerFile.min) + config.linesPerFile.min
    );
    
    modules.push({
      name: moduleName,
      path: `src/${moduleName}`,
      headerContent: generateHeaderContent(moduleName, config.includeVulnerabilities),
      sourceContent: generateSourceContent(moduleName, depNames, targetLines, config.includeVulnerabilities),
      dependencies: depNames
    });
  }
  
  const buildFiles = [
    {
      name: 'main.c',
      content: generateMainC(modules)
    }
  ];
  
  if (config.buildSystem === 'make') {
    buildFiles.push({
      name: 'Makefile',
      content: generateMakefile(modules)
    });
  } else {
    buildFiles.push({
      name: 'CMakeLists.txt',
      content: generateCMakeLists(config, modules)
    });
  }
  
  buildFiles.push({
    name: 'sbom.json',
    content: JSON.stringify(generateSBOM(config, modules), null, 2)
  });
  
  return {
    modules,
    buildFiles,
    sbom: generateSBOM(config, modules)
  };
}
