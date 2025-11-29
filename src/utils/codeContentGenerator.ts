import { Module, Artifact } from '@/types/config';

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

export function generateModuleContent(
  module: Module,
  dependencyModules: Module[],
  targetLines: number,
  includeVuln: boolean
) {
  // Generate header
  const guard = `${module.name.toUpperCase()}_H`;
  module.headerContent = `#ifndef ${guard}
#define ${guard}

#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// Module: ${module.name}
// Path: ${module.path}

typedef struct ${module.name}_context {
    int initialized;
    void* data;
    size_t data_size;
} ${module.name}_context_t;

// Public API
int ${module.name}_init(${module.name}_context_t* ctx);
int ${module.name}_process(${module.name}_context_t* ctx, const char* input);
int ${module.name}_cleanup(${module.name}_context_t* ctx);
${includeVuln ? `int ${module.name}_vulnerable_function(char* input);` : ''}

#endif // ${guard}
`;

  // Generate source
  let source = `#include "${module.name}.h"\n`;
  
  dependencyModules.forEach(dep => {
    source += `#include "${dep.name}.h"\n`;
  });
  
  source += `\n// Implementation for ${module.name}\n// Part of: ${module.path}\n\n`;
  
  source += `int ${module.name}_init(${module.name}_context_t* ctx) {
    if (ctx == NULL) return -1;
    ctx->initialized = 1;
    ctx->data = malloc(1024);
    ctx->data_size = 1024;
    if (ctx->data == NULL) return -1;
    return 0;
}\n\n`;

  source += `int ${module.name}_process(${module.name}_context_t* ctx, const char* input) {
    if (ctx == NULL || !ctx->initialized) return -1;
    if (input == NULL) return -1;
    size_t len = strlen(input);
    if (len > ctx->data_size) {
        void* new_data = realloc(ctx->data, len + 1);
        if (new_data == NULL) return -1;
        ctx->data = new_data;
        ctx->data_size = len + 1;
    }
    memcpy(ctx->data, input, len + 1);
    return 0;
}\n\n`;

  source += `int ${module.name}_cleanup(${module.name}_context_t* ctx) {
    if (ctx == NULL) return -1;
    if (ctx->data != NULL) {
        free(ctx->data);
        ctx->data = NULL;
    }
    ctx->initialized = 0;
    ctx->data_size = 0;
    return 0;
}\n\n`;

  if (includeVuln) {
    const vulnType = Object.keys(CVE_PATTERNS)[
      Math.floor(Math.random() * Object.keys(CVE_PATTERNS).length)
    ] as keyof typeof CVE_PATTERNS;
    
    source += `int ${module.name}_vulnerable_function(char* input) {
${CVE_PATTERNS[vulnType]}
    return 0;
}\n\n`;
  }
  
  // Padding to reach target lines
  const currentLines = source.split('\n').length;
  const remainingLines = targetLines - currentLines;
  
  if (remainingLines > 0) {
    const numHelpers = Math.ceil(remainingLines / 12);
    for (let i = 0; i < numHelpers; i++) {
      source += `static int ${module.name}_helper_${i}(int param) {
    int result = param * 2 + ${i};
    if (result > 100) result = result % 100;
    return result;
}\n\n`;
    }
  }
  
  module.sourceContent = source;
  module.linesOfCode = source.split('\n').length;
}

export function generateArtifactMakefile(artifact: Artifact, allArtifacts: Artifact[]): string {
  const depArtifacts = artifact.dependencies
    .map(depId => allArtifacts.find(a => a.id === depId))
    .filter(a => a !== undefined) as Artifact[];
  
  const objects = artifact.modules.map(m => `${m.name}.o`).join(' ');
  const target = artifact.type === 'executable' 
    ? artifact.name 
    : artifact.type === 'shared-lib'
    ? `lib${artifact.name}.so`
    : `lib${artifact.name}.a`;
  
  let makefile = `# Makefile for ${artifact.name} (${artifact.type})
CC = gcc
CFLAGS = -Wall -Wextra -fPIC -I.
LDFLAGS = ${depArtifacts.map(d => `-L../${d.path} -l${d.name}`).join(' ')}

OBJECTS = ${objects}

all: ${target}

`;

  if (artifact.type === 'executable') {
    makefile += `${target}: $(OBJECTS)
\t$(CC) $(LDFLAGS) -o $@ $^

`;
  } else if (artifact.type === 'shared-lib') {
    makefile += `${target}: $(OBJECTS)
\t$(CC) -shared $(LDFLAGS) -o $@ $^

`;
  } else {
    makefile += `${target}: $(OBJECTS)
\tar rcs $@ $^

`;
  }

  artifact.modules.forEach(m => {
    makefile += `${m.name}.o: ${m.name}.c ${m.name}.h\n\t$(CC) $(CFLAGS) -c ${m.name}.c\n\n`;
  });

  makefile += `clean:\n\trm -f *.o ${target}\n\n.PHONY: all clean\n`;

  return makefile;
}

export function generateRootMakefile(artifacts: Artifact[]): string {
  const subdirs = artifacts.map(a => a.path).filter((v, i, a) => a.indexOf(v) === i);
  
  return `# Root Makefile
.PHONY: all clean ${subdirs.join(' ')}

all: ${subdirs.join(' ')}

${subdirs.map(dir => `${dir}:\n\t$(MAKE) -C ${dir}\n`).join('\n')}

clean:
${subdirs.map(dir => `\t$(MAKE) -C ${dir} clean`).join('\n')}
`;
}