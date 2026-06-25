"use client";

export default function AdminEnterprisePage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Enterprise Configurations</h1>
        <p className="text-slate-400 mt-2">Manage Single Sign-On, Organizational RBAC mapping, and Organization settings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SSO Settings */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Single Sign-On (SSO)</h3>
            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-1 rounded uppercase tracking-wider">Enterprise Plan</span>
          </div>
          <p className="text-slate-400 text-sm mb-6">
            Configure SAML or OpenID Connect to allow your organization to authenticate via Okta, Google Workspace, or Azure AD.
          </p>
          
          <form className="space-y-4 opacity-50 pointer-events-none">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Identity Provider (IdP) URL</label>
              <input type="text" disabled value="https://dev-xxx.okta.com/app/xxx/sso/saml" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Entity ID / Issuer</label>
              <input type="text" disabled value="http://www.okta.com/xxx" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">X.509 Certificate</label>
              <textarea disabled value="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-slate-500 h-24" />
            </div>
            <button type="button" disabled className="bg-slate-800 text-slate-500 px-4 py-2 rounded text-sm font-semibold w-full">Save Configuration</button>
          </form>
          <div className="mt-4 text-center">
            <span className="text-xs text-cyan-500 cursor-pointer hover:underline">Contact Sales to enable SSO Integration</span>
          </div>
        </div>

        <div className="space-y-8">
          {/* RBAC Mapping */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">Role-Based Access Control Mapping</h3>
            <p className="text-slate-400 text-sm mb-4">Map IdP groups to Ravan AI internal roles automatically upon login.</p>
            <div className="bg-slate-900 border border-slate-800 rounded p-4 text-sm text-slate-500 text-center border-dashed">
              IdP sync is not currently configured.
            </div>
          </div>

          {/* API Key Vault */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-2">Organization API Key Vault</h3>
            <p className="text-slate-400 text-sm mb-4">Generate and manage API keys for programmatic access across your entire organization.</p>
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded text-sm font-semibold transition-colors w-full border border-slate-700">
              Generate Organization Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
