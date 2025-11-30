import { Module, Artifact, SupportedLanguage } from '@/types/config';

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
  if (module.language === 'cpp') {
    generateCppModuleContent(module, dependencyModules, targetLines, includeVuln);
  } else {
    generateCModuleContent(module, dependencyModules, targetLines, includeVuln);
  }
}

function generateCModuleContent(
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

function generateCppModuleContent(
  module: Module,
  dependencyModules: Module[],
  targetLines: number,
  includeVuln: boolean
) {
  // Generate header
  const guard = `${module.name.toUpperCase()}_HPP`;
  module.headerContent = `#ifndef ${guard}
#define ${guard}

#include <iostream>
#include <memory>
#include <string>
#include <vector>

// Module: ${module.name}
// Path: ${module.path}

namespace ${module.name.toLowerCase()} {

class ${module.name} {
public:
    ${module.name}();
    ~${module.name}();
    
    bool initialize();
    bool process(const std::string& input);
    void cleanup();
    ${includeVuln ? `bool vulnerableFunction(const char* input);` : ''}

private:
    bool initialized_;
    std::unique_ptr<std::vector<uint8_t>> data_;
};

} // namespace ${module.name.toLowerCase()}

#endif // ${guard}
`;

  // Generate source
  const ext = module.language === 'cpp' ? 'hpp' : 'h';
  let source = `#include "${module.name}.${ext}"\n`;
  
  dependencyModules.forEach(dep => {
    const depExt = dep.language === 'cpp' ? 'hpp' : 'h';
    source += `#include "${dep.name}.${depExt}"\n`;
  });
  
  source += `\n// Implementation for ${module.name}\n// Part of: ${module.path}\n\n`;
  source += `namespace ${module.name.toLowerCase()} {\n\n`;
  
  source += `${module.name}::${module.name}() 
    : initialized_(false), data_(nullptr) {
}\n\n`;

  source += `${module.name}::~${module.name}() {
    cleanup();
}\n\n`;

  source += `bool ${module.name}::initialize() {
    if (initialized_) return false;
    try {
        data_ = std::make_unique<std::vector<uint8_t>>(1024);
        initialized_ = true;
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Initialization failed: " << e.what() << std::endl;
        return false;
    }
}\n\n`;

  source += `bool ${module.name}::process(const std::string& input) {
    if (!initialized_) return false;
    try {
        data_->clear();
        data_->insert(data_->end(), input.begin(), input.end());
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Processing failed: " << e.what() << std::endl;
        return false;
    }
}\n\n`;

  source += `void ${module.name}::cleanup() {
    if (data_) {
        data_.reset();
    }
    initialized_ = false;
}\n\n`;

  if (includeVuln) {
    const vulnType = Object.keys(CVE_PATTERNS)[
      Math.floor(Math.random() * Object.keys(CVE_PATTERNS).length)
    ] as keyof typeof CVE_PATTERNS;
    
    source += `bool ${module.name}::vulnerableFunction(const char* input) {
${CVE_PATTERNS[vulnType]}
    return true;
}\n\n`;
  }
  
  // Padding to reach target lines
  const currentLines = source.split('\n').length;
  const remainingLines = targetLines - currentLines;
  
  if (remainingLines > 0) {
    const numHelpers = Math.ceil(remainingLines / 15);
    for (let i = 0; i < numHelpers; i++) {
      source += `// Helper function ${i}
static int helperFunction${i}(int param) {
    int result = param * 2 + ${i};
    if (result > 100) {
        result = result % 100;
    }
    return result;
}\n\n`;
    }
  }
  
  source += `} // namespace ${module.name.toLowerCase()}\n`;
  
  module.sourceContent = source;
  module.linesOfCode = source.split('\n').length;
}

export function generateArtifactMakefile(artifact: Artifact, allArtifacts: Artifact[]): string {
  const depArtifacts = artifact.dependencies
    .map(depId => allArtifacts.find(a => a.id === depId))
    .filter(a => a !== undefined) as Artifact[];
  
  const hasCpp = artifact.modules.some(m => m.language === 'cpp');
  const objects = artifact.modules.map(m => `${m.name}.o`).join(' ');
  const target = artifact.type === 'executable' 
    ? artifact.name 
    : artifact.type === 'shared-lib'
    ? `lib${artifact.name}.so`
    : `lib${artifact.name}.a`;
  
  let makefile = `# Makefile for ${artifact.name} (${artifact.type})
CC = gcc
CXX = g++
CFLAGS = -Wall -Wextra -fPIC -I.
CXXFLAGS = -Wall -Wextra -fPIC -I. -std=c++17
LDFLAGS = ${depArtifacts.map(d => `-L../${d.path} -l${d.name}`).join(' ')}
${hasCpp ? 'LINKER = $(CXX)' : 'LINKER = $(CC)'}

OBJECTS = ${objects}

all: ${target}

`;

  if (artifact.type === 'executable') {
    makefile += `${target}: $(OBJECTS)
\t$(LINKER) $(LDFLAGS) -o $@ $^

`;
  } else if (artifact.type === 'shared-lib') {
    makefile += `${target}: $(OBJECTS)
\t$(LINKER) -shared $(LDFLAGS) -o $@ $^

`;
  } else {
    makefile += `${target}: $(OBJECTS)
\tar rcs $@ $^

`;
  }

  artifact.modules.forEach(m => {
    const ext = m.language === 'cpp' ? 'cpp' : 'c';
    const headerExt = m.language === 'cpp' ? 'hpp' : 'h';
    const compiler = m.language === 'cpp' ? '$(CXX)' : '$(CC)';
    const flags = m.language === 'cpp' ? '$(CXXFLAGS)' : '$(CFLAGS)';
    makefile += `${m.name}.o: ${m.name}.${ext} ${m.name}.${headerExt}\n\t${compiler} ${flags} -c ${m.name}.${ext}\n\n`;
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