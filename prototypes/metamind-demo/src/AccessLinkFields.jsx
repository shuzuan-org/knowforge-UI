import React from 'react';
import './knowledge-use.css';

export function AccessLinkFields({scope,address,status,permission,error,inputLabel,placeholder}) {
  return <div className="mm-dialog-body mm-agent-access-body mm-mcp-access-body">
    <section className="mm-access-range" aria-label="访问范围"><span>访问范围</span><p>{scope}</p></section>
    <label className="mm-agent-access-example"><span className="mm-mcp-access-label"><span>链接地址</span>{status&&<span className="mm-mcp-access-status">{status}</span>}</span>
      <input aria-label={inputLabel} type="text" readOnly spellCheck={false} value={address} placeholder={placeholder} onFocus={event=>event.currentTarget.select()}/>
    </label>
    <p className="mm-agent-access-permission">{permission}</p>
    {error&&<p className="mm-field-error" role="alert">{error}</p>}
  </div>;
}
