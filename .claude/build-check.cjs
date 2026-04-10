/**
 * PostToolUse hook: src/ 파일 변경 시 빌드 검증
 * stdin으로 Claude Code hook payload(JSON)를 받아 처리
 */
const { execSync } = require('child_process');

let data = '';
process.stdin.on('data', (chunk) => (data += chunk));
process.stdin.on('end', () => {
  const payload = JSON.parse(data);
  const filePath = payload.tool_input?.file_path || payload.tool_response?.filePath || '';

  // 경로 정규화: 백슬래시 → 슬래시
  const normalized = filePath.replace(/\\/g, '/');

  if (!normalized.includes('/src/')) {
    // src/ 외부 파일 변경은 빌드 스킵
    return;
  }

  try {
    execSync('npm run build', {
      cwd: 'd:/dev/personal/dnf_gyo',
      stdio: 'pipe',
      timeout: 120000,
    });
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        additionalContext: '빌드 성공: 코드 변경 후 빌드 검증 통과',
      },
    }));
  } catch (e) {
    const stderr = e.stderr?.toString()?.slice(-2000) || 'Unknown error';
    console.log(JSON.stringify({
      continue: false,
      stopReason: '빌드 실패! 오류를 수정하세요:\n' + stderr,
    }));
  }
});
