export function WorkspaceGuide({ onCreate }) {
  return <div className="kb-guide-body">
    <article className="ui-knowledge-guide" aria-label="知识库用法">
      <section>
        <h2>从哪里开始</h2>
        <p>「知识库」集中展示你创建的知识库和别人分享给你的知识库。建库时可以按主题整理资料，例如公司材料、产品手册或行业文献。</p>
      </section>
      <section>
        <h2>创建并导入资料</h2>
        <ol>
          <li>点击「新建知识库」，填写名称和说明。</li>
          <li>选择文件、文件夹或网页链接。也可以稍后在知识库详情中点击「添加资料」。</li>
          <li>在「文件」页签查看整理状态，到「Wiki」阅读可用的内容。</li>
        </ol>
        <button type="button" className="kb-secondary" onClick={onCreate}>新建知识库</button>
      </section>
      <section>
        <h2>阅读和提问</h2>
        <p>在「Wiki」搜索页面或按主题筛选，打开正文后可以查看引用。在详情中点击「添加到对话」，可针对当前知识库提问。</p>
        <p>本地问答按内容匹配并提供引用片段，便于核对原文。</p>
        <a href="/workspace?ask=1">前往知识问答 →</a>
      </section>
      <section>
        <h2>把知识库分享给别人</h2>
        <p>打开知识库的「分享与链接」，开启分享。链接可在当前浏览器接收，跨浏览器可导出分享文件。接收后可从「与我共享」打开。</p>
        <a href="/guide">查看完整使用说明 →</a>
      </section>
    </article>
  </div>;
}
