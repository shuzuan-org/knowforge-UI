#!/bin/zsh
set -u
cd -- "${0:A:h}"
KNOWLEDGE_URL='http://localhost:8767/'
if [[ "$(/usr/bin/curl --silent --max-time 1 http://127.0.0.1:8767/__mirror_health)" == 'metamind-local-ui' ]]; then
  /usr/bin/open "$KNOWLEDGE_URL"
  exit 0
fi
KNOWLEDGE_NODE="$(command -v node 2>/dev/null || true)"
if [[ -z "$KNOWLEDGE_NODE" ]]; then
  for KNOWLEDGE_CANDIDATE in /opt/homebrew/bin/node /usr/local/bin/node "$HOME"/.nvm/versions/node/v*/bin/node(N); do
    if [[ -x "$KNOWLEDGE_CANDIDATE" ]]; then
      KNOWLEDGE_NODE="$KNOWLEDGE_CANDIDATE"
      break
    fi
  done
fi
if [[ -z "$KNOWLEDGE_NODE" ]]; then
  print '请先安装 Node.js 22 或更新版本，再运行本文件。'
  read 'KNOWLEDGE_REPLY?按回车关闭'
  exit 1
fi
"$KNOWLEDGE_NODE" server.mjs &
KNOWLEDGE_PID=$!
trap 'kill "$KNOWLEDGE_PID" 2>/dev/null || true' EXIT
trap 'exit 0' INT TERM
for KNOWLEDGE_ATTEMPT in {1..50}; do
  if ! kill -0 "$KNOWLEDGE_PID" 2>/dev/null; then
    print '启动未成功，请检查上方信息或 8767 端口是否被占用。'
    read 'KNOWLEDGE_REPLY?按回车关闭'
    exit 1
  fi
  if [[ "$(/usr/bin/curl --silent --max-time 1 http://127.0.0.1:8767/__mirror_health)" == 'metamind-local-ui' ]]; then
    /usr/bin/open "$KNOWLEDGE_URL"
    print '知识库已打开；请保持此终端窗口开启。'
    wait "$KNOWLEDGE_PID"
    exit $?
  fi
  sleep 0.1
done
print '启动超时，请查看终端中的错误信息。'
read 'KNOWLEDGE_REPLY?按回车关闭'
exit 1
