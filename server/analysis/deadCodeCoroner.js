class DeadCodeCoroner {
  analyze(tree, commits) {
    const findings = {
      name: 'Dead Code Coroner',
      score: 0,
      details: {},
      deceased: [],
      totalDeadFiles: 0
    };

    if (!tree || !tree.tree) return findings;

    const files = tree.tree || [];
    const now = new Date();

    // Only analyze source code files
    const sourceFiles = files.filter(f => {
      if (!f || f.type !== 'blob' || !f.path) return false;
      return /\.(js|ts|jsx|tsx|py|rb|go|rs|java|c|cpp|h)$/i.test(f.path);
    });

    const filesByDir = {};
    sourceFiles.forEach(f => {
      const dir = f.path.split('/').slice(0, -1).join('/') || '/';
      if (!filesByDir[dir]) filesByDir[dir] = [];
      filesByDir[dir].push(f.path);
    });

    // Detect likely dead code patterns
    sourceFiles.forEach(f => {
      if (!f || !f.path) return;
      const lowerPath = f.path.toLowerCase();
      const name = lowerPath.split('/').pop() || '';
      
      let cause = null;
      let confidence = 'low';

      if (name.includes('old') || name.includes('backup') || name.includes('.bak')) {
        cause = 'Name suggests legacy/deprecated code';
        confidence = 'high';
      } else if (name.includes('temp') || name.includes('tmp')) {
        cause = 'Temporary file that was never cleaned up';
        confidence = 'high';
      } else if (name.includes('unused') || name.includes('deprecated')) {
        cause = 'Explicitly marked as unused or deprecated';
        confidence = 'high';
      } else if (lowerPath.includes('legacy/')) {
        cause = 'Located in legacy directory';
        confidence = 'medium';
      } else if (name.startsWith('_') && name.endsWith('.js')) {
        cause = 'Underscore prefix often indicates disabled/dead code';
        confidence = 'low';
      }

      if (cause) {
        findings.deceased.push({
          file: f.path,
          caseNumber: findings.deceased.length + 1,
          causeOfDeath: cause,
          confidence,
          lastKnownActivity: 'Unknown',
          lastAuthor: 'Unknown',
          daysSinceLastActivity: null,
          dependents: this._findDependents(f.path, sourceFiles)
        });
      }
    });

    // Detect orphaned utility/helper files
    sourceFiles.forEach(f => {
      if (!f || !f.path) return;
      if (/helper|util|misc|common|shared|tools/i.test(f.path) && !/node_modules/.test(f.path)) {
        const deps = this._findDependents(f.path, sourceFiles);
        if (deps.length === 0) {
          findings.deceased.push({
            file: f.path,
            caseNumber: findings.deceased.length + 1,
            causeOfDeath: 'Utility file with no detectable importers — orphaned',
            confidence: 'medium',
            lastKnownActivity: 'Unknown',
            daysSinceLastActivity: null,
            dependents: []
          });
        }
      }
    });

    findings.totalDeadFiles = findings.deceased.length;
    findings.details.sourceFileCount = sourceFiles.length;
    findings.details.deathRate = sourceFiles.length > 0
      ? Math.round((findings.deceased.length / sourceFiles.length) * 100)
      : 0;

    return findings;
  }

  _findDependents(filePath, allFiles) {
    if (!filePath || !allFiles) return [];
    const parts = filePath.split('/');
    if (parts.length < 2) return [];
    
    const fileName = parts.pop();
    if (!fileName) return [];
    
    const baseName = fileName.replace(/\.[^.]+$/, '');
    const dir = parts.join('/');

    return allFiles
      .filter(f => f && f.path && f.path !== filePath && f.path.startsWith(dir))
      .map(f => f.path)
      .slice(0, 3);
  }
}

module.exports = DeadCodeCoroner;
