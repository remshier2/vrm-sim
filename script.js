const state = { type: null, vendor: null, data: [], signals: [] };
const history = [];
const feedbackLog = [];
let lastTier = null;

const SCENARIOS = {
  'chatgpt-free':    { name: 'ChatGPT free tier', type: 'free', vendor: 'none', data: ['internal','transmits'], signals: ['ai-explicit','personal-account','trains-on-data','no-zdr','no-dpa'] },
  'personal-gdrive': { name: 'Personal Google Drive', type: 'free', vendor: 'none', data: ['internal','transmits'], signals: ['consumer-grade','personal-account','no-dpa'] },
  'cracked-software':{ name: 'Cracked software', type: 'local', vendor: 'none', data: [], signals: ['unverified-source'] },
  'high-risk-ai':    { name: 'High-risk jurisdiction AI tool', type: 'saas', vendor: 'new', data: ['internal','transmits'], signals: ['ai-explicit','high-risk-jurisdiction','no-dpa','no-zdr'] },
  'shadow-saas':     { name: 'Unapproved SaaS already in use', type: 'saas', vendor: 'new', data: ['internal','transmits'], signals: ['shadow-it','purchase'] },
  'shadow-ai':       { name: 'AI tool already in use — no approval', type: 'saas', vendor: 'new', data: ['pii','transmits'], signals: ['ai-explicit','shadow-it','purchase'] },
  copilot:           { name: 'GitHub Copilot', type: 'saas', vendor: 'new', data: ['sourcecode','transmits'], signals: ['ai-explicit','purchase'] },
  zapier:            { name: 'Zapier', type: 'saas', vendor: 'new', data: ['internal','transmits'], signals: ['purchase'] },
  veracode:          { name: 'Veracode', type: 'saas', vendor: 'new', data: ['sourcecode','transmits'], signals: ['purchase'] },
  docusign:          { name: 'DocuSign', type: 'saas', vendor: 'new', data: ['internal','transmits'], signals: ['purchase'] },
  'workday-new':     { name: 'Workday (net new)', type: 'saas', vendor: 'new', data: ['pii','financial','transmits'], signals: ['purchase','regulatory'] },
  'data-provider':   { name: 'Bloomberg data feed', type: 'data-feed', vendor: 'new', data: ['financial','transmits'], signals: ['purchase'] },
  'managed-soc':     { name: 'Managed SOC service', type: 'managed-service', vendor: 'new', data: ['internal','transmits'], signals: ['purchase','subprocessors'] },
  'salesforce-maps': { name: 'Salesforce Maps', type: 'addon', vendor: 'existing', data: ['internal'], signals: ['purchase','marketplace','published-by-platform'] },
  'slack-ai':        { name: 'Slack AI', type: 'addon', vendor: 'existing', data: ['internal','transmits'], signals: ['ai','free-tier'] },
  'teams-ms':        { name: 'Microsoft Viva', type: 'addon', vendor: 'existing', data: ['internal'], signals: ['published-by-platform','marketplace'] },
  'sf-appex':        { name: 'Third-party Salesforce AppExchange app', type: 'addon', vendor: 'new', data: ['internal','transmits'], signals: ['thirdparty-plugin'] },
  'renewal':         { name: 'Vendor contract renewal', type: 'saas', vendor: 'renewal', data: ['internal','transmits'], signals: [] },
  'subsidiary':      { name: 'Product from subsidiary of approved vendor', type: 'saas', vendor: 'subsidiary', data: ['internal','transmits'], signals: ['purchase'] },
  'scope-change':    { name: 'Existing tool — new use case with PII', type: 'saas', vendor: 'approved-ent', data: ['pii','transmits'], signals: ['scope-change'] },
  pandas:            { name: 'pandas', type: 'oss', vendor: 'none', data: ['internal'], signals: ['oss-permissive','production'] },
  'pandas-dev':      { name: 'pandas (dev only)', type: 'oss', vendor: 'none', data: ['none'], signals: ['oss-permissive','dev-only'] },
  'gpl-lib':         { name: 'GPL licensed library', type: 'oss', vendor: 'none', data: ['internal'], signals: ['oss-gpl','production'] },
  grammarly:         { name: 'Grammarly free', type: 'free', vendor: 'none', data: [], signals: [] },
  notepad:           { name: 'Notepad++', type: 'local', vendor: 'none', data: ['none'], signals: ['offline'] },
  driver:            { name: 'HP printer driver', type: 'bundled', vendor: 'none', data: ['none'], signals: ['offline'] },
  'mobile-nodata':   { name: 'Internal mobile utility app', type: 'mobile-app', vendor: 'none', data: ['none'], signals: [] },
  'browser-ext':     { name: 'Browser extension — form filler', type: 'browser-ext', vendor: 'none', data: ['internal','transmits'], signals: [] },
  'tableau-new-bu':  { name: 'Tableau (new BU)', type: 'saas', vendor: 'approved-bu', data: ['internal'], signals: [] },
  'existing-expired':{ name: 'Lapsed vendor contract', type: 'saas', vendor: 'existing-expired', data: ['internal','transmits'], signals: ['purchase'] },
};

function loadScenario(key) {
  const s = SCENARIOS[key];
  document.getElementById('inp-name').value = s.name;
  state.type = s.type; state.vendor = s.vendor;
  state.data = [...s.data]; state.signals = [...s.signals];
  syncChips();
  evaluate();
}

function syncChips() {
  document.querySelectorAll('.chip[data-group]').forEach(c => {
    const g = c.dataset.group, v = c.dataset.val;
    c.classList.remove('on');
    if (g === 'type' || g === 'vendor') { if (state[g] === v) c.classList.add('on'); }
    else if (state[g] && state[g].includes(v)) c.classList.add('on');
  });
}

function chipClick(el) {
  const g = el.dataset.group, v = el.dataset.val;
  if (g === 'type' || g === 'vendor') {
    document.querySelectorAll('[data-group="' + g + '"]').forEach(x => x.classList.remove('on'));
    el.classList.toggle('on');
    state[g] = el.classList.contains('on') ? v : null;
  } else {
    el.classList.toggle('on');
    if (!state[g]) state[g] = [];
    if (el.classList.contains('on')) { if (!state[g].includes(v)) state[g].push(v); }
    else state[g] = state[g].filter(x => x !== v);
  }
}

function feedbackTierClick(el) {
  document.querySelectorAll('[data-feedback-tier]').forEach(x => x.classList.remove('on'));
  el.classList.add('on');
}

function loadScenario(key) {
  const s = SCENARIOS[key];
  document.getElementById('inp-name').value = s.name;
  state.type = s.type; state.vendor = s.vendor;
  state.data = [...s.data]; state.signals = [...s.signals];
  syncChips();
  evaluate();
}

function syncChips() {
  document.querySelectorAll('.chip[data-group]').forEach(c => {
    const g = c.dataset.group, v = c.dataset.val;
    c.classList.remove('on');
    if (g === 'type' || g === 'vendor') { if (state[g] === v) c.classList.add('on'); }
    else if (state[g] && state[g].includes(v)) c.classList.add('on');
  });
}

function resetAll() {
  document.getElementById('inp-name').value = '';
  state.type = null; state.vendor = null; state.data = []; state.signals = [];
  syncChips();
  document.getElementById('result-area').innerHTML = '<div class="empty-state"><div class="empty-icon">[ ]</div>Select signals above and click Classify</div>';
  document.getElementById('feedback-area').style.display = 'none';
  lastTier = null;
}

document.querySelectorAll('.chip[data-group]').forEach(c => c.addEventListener('click', function() {
  const g = this.dataset.group, v = this.dataset.val;
  if (g === 'type' || g === 'vendor') {
    document.querySelectorAll('[data-group="' + g + '"]').forEach(x => x.classList.remove('on'));
    this.classList.toggle('on');
    state[g] = this.classList.contains('on') ? v : null;
  } else {
    this.classList.toggle('on');
    if (!state[g]) state[g] = [];
    if (this.classList.contains('on')) { if (!state[g].includes(v)) state[g].push(v); }
    else state[g] = state[g].filter(x => x !== v);
  }
}));

document.querySelectorAll('[data-feedback-tier]').forEach(c => c.addEventListener('click', function() {
  document.querySelectorAll('[data-feedback-tier]').forEach(x => x.classList.remove('on'));
  this.classList.add('on');
}));

function markFeedback(type) {
  document.getElementById('fc-agree').classList.remove('agree');
  document.getElementById('fc-disagree').classList.remove('disagree');
  document.getElementById('feedback-thanks').style.display = 'none';
  if (type === 'agree') {
    document.getElementById('fc-agree').classList.add('agree');
    document.getElementById('feedback-detail').style.display = 'none';
    submitFeedback('agree');
  } else {
    document.getElementById('fc-disagree').classList.add('disagree');
    document.getElementById('feedback-detail').style.display = 'block';
  }
}

function submitFeedback(type) {
  const name = document.getElementById('inp-name').value.trim() || 'Unknown';
  const notes = document.getElementById('feedback-notes') ? document.getElementById('feedback-notes').value : '';
  const suggested = document.querySelector('[data-feedback-tier].on');
  feedbackLog.push({
    tool: name, classified: lastTier,
    feedback: type || 'disagree',
    suggested: suggested ? suggested.dataset.feedbackTier : null,
    notes, timestamp: new Date().toLocaleTimeString()
  });
  document.getElementById('feedback-detail').style.display = 'none';
  document.getElementById('feedback-thanks').style.display = 'block';
}

function evaluate() {
  const name = document.getElementById('inp-name').value.trim() || 'This tool';
  const { type, vendor, data, signals } = state;
  if (!type && !vendor) {
    document.getElementById('result-area').innerHTML = '<div class="empty-state"><div class="empty-icon">[ ]</div>Select at least a tool type and vendor relationship</div>';
    return;
  }

  const hasAI = signals.includes('ai') || signals.includes('ai-explicit') || signals.includes('ai-generative') || signals.includes('ai-decision') || signals.includes('embedded-ai') || type === 'embedded-ai';
  const aiExplicit = signals.includes('ai-explicit') || signals.includes('ai-generative') || type === 'embedded-ai';
  const aiDecision = signals.includes('ai-decision');
  const hasPurchase = signals.includes('purchase');
  const hasRegulatory = signals.includes('regulatory');
  const offline = signals.includes('offline');
  const transmits = offline ? false : (data.includes('transmits') || type === 'saas' || type === 'api' || type === 'data-feed');
  const sensitiveData = data.includes('pii') || data.includes('phi') || data.includes('financial') || data.includes('sourcecode') || data.includes('credentials') || data.includes('legal') || data.includes('biometric') || data.includes('client-data');
  const noData = (data.includes('none') || data.includes('public') || data.length === 0) && !data.includes('transmits');
  const isProduction = signals.includes('production');
  const devOnly = signals.includes('dev-only');
  const personalAccount = signals.includes('personal-account');
  const trainsOnData = signals.includes('trains-on-data');
  const noZDR = signals.includes('no-zdr');
  const noDPA = signals.includes('no-dpa');
  const consumerGrade = signals.includes('consumer-grade');
  const highRiskJurisdiction = signals.includes('high-risk-jurisdiction');
  const unverifiedSource = signals.includes('unverified-source');
  const noSecurityDocs = signals.includes('no-security-docs');
  const shadowIT = signals.includes('shadow-it');
  const freeTier = signals.includes('free-tier');
  const marketplace = signals.includes('marketplace');
  const thirdPartyPlugin = signals.includes('thirdparty-plugin');
  const publishedByPlatform = signals.includes('published-by-platform');
  const ossPermissive = signals.includes('oss-permissive');
  const ossGPL = signals.includes('oss-gpl');
  const ossAGPL = signals.includes('oss-agpl');
  const subprocessors = signals.includes('subprocessors');
  const offshore = signals.includes('offshore');
  const scopeChange = signals.includes('scope-change');
  const clientFacing = signals.includes('client-facing');
  const broadRollout = signals.includes('broad-rollout');
  const isRenewal = vendor === 'renewal';
  const isSubsidiary = vendor === 'subsidiary';
  const isReseller = vendor === 'reseller';
  const isExpired = vendor === 'existing-expired';
  const newVendor = vendor === 'new' || hasPurchase || type === 'contractor' || type === 'managed-service' || type === 'data-feed' || type === 'api';

  let tier = null, reason = '', redirect = '', modifiers = [];

  if (unverifiedSource) {
    tier = 'PROH'; reason = name + ' cannot be approved. Cracked, pirated, or unverified software is prohibited regardless of use case or business justification.';
    modifiers = ['unverified or pirated source'];
  } else if (personalAccount && aiExplicit && transmits) {
    tier = 'PROH'; reason = name + ' is an AI tool being accessed through a personal account with company data transmitted externally. Personal accounts for AI tools have no enterprise data handling controls and cannot be made compliant.';
    redirect = 'If ' + name + ' offers an enterprise tier with ZDR and a DPA, that version may be submitted through Track 3.';
    modifiers = ['personal AI account', 'no enterprise controls', 'data transmitted'];
  } else if (personalAccount && transmits && (trainsOnData || noZDR || noDPA)) {
    tier = 'PROH'; reason = name + ' is being used through a personal or free account without enterprise data handling protections. The vendor trains on inputs by default, has no ZDR option, or no DPA is available. This configuration cannot be made compliant.';
    redirect = 'If an enterprise or business tier exists for ' + name + ', submit that version through Track 3 instead.';
    modifiers = ['personal account', 'no enterprise data protections'];
  } else if (consumerGrade && transmits && noDPA) {
    tier = 'PROH'; reason = name + ' is a consumer-grade tool being used with business data with no Data Processing Agreement available. This cannot be made compliant regardless of review outcome.';
    redirect = 'Consider whether a business-tier alternative exists for this use case.';
    modifiers = ['consumer-grade', 'business data', 'no DPA'];
  } else if (highRiskJurisdiction && noDPA && transmits) {
    tier = 'PROH'; reason = name + ' is operated by a vendor in a high-risk jurisdiction with no DPA available and transmits data externally. This cannot be approved under current policy.';
    redirect = 'Escalate to the Governance team if there is a compelling business case for further review.';
    modifiers = ['high-risk jurisdiction', 'no DPA', 'external data transmission'];
  }

  if (!tier && vendor === 'approved-ent' && !scopeChange) {
    tier = 'VL'; reason = name + ' is already approved for use across the organization. No further action required.';
    modifiers = ['existing enterprise approval'];
  }
  if (!tier && vendor === 'approved-ent' && scopeChange) {
    tier = 'T2'; reason = name + ' is enterprise-approved but the intended use represents a scope change from the original approval. A medium review is needed to assess whether the new scope stays within the existing risk assessment.';
    modifiers = ['existing enterprise approval', 'scope change'];
  }
  if (!tier && vendor === 'approved-bu') {
    tier = 'BU'; reason = name + ' is vendor-approved but not yet cleared for this business unit. A BU readout is required — the vendor vetting is already complete so this will be a lighter process.';
    modifiers = ['existing approval — other BU'];
  }
  if (!tier && isRenewal) {
    tier = 'T2'; reason = name + ' is a contract renewal with an existing vendor. A medium review is required to confirm nothing material has changed — data scope, subprocessors, pricing model, or terms.';
    modifiers = ['contract renewal', 'existing vendor'];
  }
  if (!tier && isExpired) {
    tier = 'T3'; reason = name + ' was previously contracted but the contract has lapsed. Treating as a net new engagement — full vendor review required to reinstate the relationship.';
    modifiers = ['expired contract', 'lapsed vendor relationship'];
  }
  if (!tier && isSubsidiary && transmits) {
    tier = 'T3'; reason = name + ' is a subsidiary of an approved vendor but is a separate legal entity. The parent approval does not automatically extend. Full review required.';
    modifiers = ['subsidiary of approved vendor', 'separate legal entity'];
  }
  if (!tier && isReseller) {
    tier = 'T2'; reason = name + ' is resold through an approved vendor. The underlying product still needs a medium review to confirm the data handling and liability flow through the approved reseller relationship.';
    modifiers = ['resold via approved vendor'];
  }

  if (!tier && (sensitiveData && transmits)) {
    tier = 'T3'; reason = name + ' transmits sensitive or regulated data externally. Full vendor risk review and DDQ required.';
    modifiers = ['sensitive data transmitted externally'];
    if (newVendor) modifiers.push('net new vendor');
    if (hasRegulatory) modifiers.push('regulatory scope');
    if (subprocessors) modifiers.push('vendor uses subprocessors');
    if (offshore) modifiers.push('offshore data processing');
  }
  if (!tier && hasRegulatory && transmits) {
    tier = 'T3'; reason = name + ' falls under regulatory compliance requirements with external data transmission. Full vendor risk review required.';
    modifiers = ['regulatory scope', 'external transmission'];
  }
  if (!tier && aiExplicit && newVendor) {
    tier = 'T3'; reason = name + ' is a net new AI service. Full vendor risk review required — explicit AI tools with new vendor relationships always require full review.';
    modifiers = ['explicit AI tool', 'net new vendor relationship'];
    if (aiDecision) modifiers.push('AI makes decisions affecting people');
  }
  if (!tier && thirdPartyPlugin && !publishedByPlatform) {
    tier = 'T3'; reason = name + ' is a third-party plugin that introduces a new vendor relationship with access to platform data. Full review required even though the host platform is already approved.';
    modifiers = ['third-party plugin', 'new vendor via approved platform'];
  }
  if (!tier && newVendor && transmits) {
    tier = 'T3'; reason = name + ' creates a net new vendor relationship where an external party will process or store your data. Full vendor risk review required.';
    modifiers = ['net new vendor', 'data transmitted externally'];
    if (subprocessors) modifiers.push('vendor uses subprocessors');
    if (offshore) modifiers.push('offshore data processing');
    if (clientFacing) modifiers.push('client-facing deployment');
    if (noSecurityDocs) modifiers.push('no security documentation available');
  }
  if (!tier && newVendor && !noData) {
    tier = 'T3'; reason = name + ' creates a net new vendor relationship. Full review is required to establish this vendor relationship.';
    modifiers = ['net new vendor relationship'];
  }
  if (!tier && type === 'managed-service') {
    tier = 'T3'; reason = name + ' is a managed service where a third party operates a process on your behalf. Full vendor review required.';
    modifiers = ['managed service', 'third-party operational access'];
  }
  if (!tier && type === 'data-feed' && newVendor) {
    tier = 'T3'; reason = name + ' is a net new data provider. Full vendor review required to assess data provenance, licensing, and any sharing obligations.';
    modifiers = ['net new data feed provider'];
  }
  if (!tier && shadowIT && sensitiveData) {
    tier = 'T3'; reason = name + ' has already been in use without approval and involves sensitive data. Retroactive full review required — treat as urgent.';
    modifiers = ['shadow IT', 'sensitive data already involved'];
    redirect = 'Flag this to the Governance team immediately given it is already in active use.';
  }

  if (!tier && (vendor === 'existing' || freeTier || publishedByPlatform)) {
    if (hasAI) {
      tier = 'T2'; reason = name + ' introduces AI functionality within an existing vendor relationship. Medium internal review required — AI always raises the floor by at least one track.';
      modifiers = ['AI feature', 'existing vendor relationship'];
      if (transmits) modifiers.push('data transmitted');
      if (aiDecision) modifiers.push('AI decision-making present');
    } else if (scopeChange) {
      tier = 'T2'; reason = name + ' represents a scope change within an existing vendor relationship. Medium internal review needed to assess whether the new scope is covered by the existing contract and risk assessment.';
      modifiers = ['existing vendor', 'scope change from prior approval'];
    } else if (publishedByPlatform) {
      tier = 'T2'; reason = name + ' is published by the same vendor as the platform it runs in. It falls under the existing vendor relationship and requires a medium internal review to confirm scope alignment.';
      modifiers = ['published by platform vendor', 'existing vendor relationship'];
    } else if (marketplace) {
      tier = 'T2'; reason = name + ' is an add-on or enhancement from an existing approved vendor. A brief internal review is needed to confirm it stays within the established risk scope.';
      modifiers = ['existing vendor add-on'];
    } else {
      tier = 'T2'; reason = name + ' extends an existing vendor relationship. A medium internal review is required to confirm the scope stays within what was originally assessed.';
      modifiers = ['existing vendor extension'];
      if (transmits) modifiers.push('data transmitted');
    }
  }
  if (!tier && ossGPL) {
    tier = 'T2'; reason = name + ' uses a GPL license which may create legal obligations. Internal review including a legal license check is required.';
    modifiers = ['GPL license', 'legal obligation check'];
  }
  if (!tier && (ossAGPL || (type === 'oss' && !ossPermissive && !ossGPL))) {
    if (isProduction) {
      tier = 'T3'; reason = name + ' uses a restrictive or unknown license and runs in production. Full review required.';
      modifiers = ['restrictive or unknown OSS license', 'production use'];
    } else {
      tier = 'T2'; reason = name + ' uses a restrictive or unknown license. Internal review required before use.';
      modifiers = ['restrictive or unknown OSS license'];
    }
  }
  if (!tier && hasAI && !noData) {
    tier = 'T2'; reason = name + ' includes AI functionality with data access. Medium internal review required.';
    modifiers = ['AI features', 'data access'];
    if (aiDecision) modifiers.push('AI decision-making');
  }
  if (!tier && shadowIT) {
    tier = 'T2'; reason = name + ' has already been in use without approval. A medium review is needed to retroactively assess and document the risk. Usage should be paused pending review.';
    modifiers = ['shadow IT — already in use without approval'];
    redirect = 'Notify the Governance team that this tool is already in active use.';
  }
  if (!tier && type === 'free' && transmits && !noData) {
    tier = 'T2'; reason = name + ' is a free tool that transmits internal data externally. Medium internal review needed to assess data exposure.';
    modifiers = ['free tool', 'data transmitted externally'];
  }
  if (!tier && clientFacing && !noData) {
    tier = 'T2'; reason = name + ' has a client-facing deployment context. A medium review is needed to confirm it meets any client-specific obligations.';
    modifiers = ['client-facing', 'data involved'];
  }
  if (!tier && broadRollout && !noData) {
    tier = 'T2'; reason = name + ' is planned for broad rollout across many users. A medium review is appropriate given the scale of exposure even if individual risk signals are low.';
    modifiers = ['broad rollout', 'scale of exposure'];
  }
  if (!tier && type === 'browser-ext' && transmits) {
    tier = 'T2'; reason = name + ' is a browser extension that transmits data externally. Browser extensions have elevated risk due to broad page access — medium review required.';
    modifiers = ['browser extension', 'external data transmission'];
  }

  if (!tier && ossPermissive && isProduction && !devOnly) {
    tier = 'T1'; reason = name + ' is open source with a permissive license running in production. A light internal review is needed to validate the runtime context.';
    modifiers = ['permissive OSS', 'production use'];
  }
  if (!tier && hasAI && noData) {
    tier = 'T1'; reason = name + ' has AI features but no data access confirmed. A light review is needed to confirm no data risk in practice.';
    modifiers = ['AI features', 'no data access'];
  }
  if (!tier && (type === 'free' || type === 'local' || type === 'browser-ext') && !offline && !noData) {
    tier = 'T1'; reason = name + ' has network connectivity with some data involvement but no confirmed external transmission. A lightweight review is sufficient.';
    modifiers = ['network connectivity', 'minor data involvement'];
  }
  if (!tier && type === 'mobile-app' && noData) {
    tier = 'T1'; reason = name + ' is a mobile app with no company data access. A light review is needed to confirm app permissions stay within acceptable bounds.';
    modifiers = ['mobile app', 'no data access confirmed'];
  }
  if (!tier && (type === 'hardware') && !noData) {
    tier = 'T1'; reason = name + ' is a hardware device with some data involvement. A light review is needed to confirm connectivity and data handling.';
    modifiers = ['hardware device', 'data involvement'];
  }

  if (!tier && (type === 'bundled' || type === 'local' || type === 'firmware' || type === 'driver') && offline && noData) {
    tier = 'VL'; reason = name + ' runs locally with no network connectivity and no data access. Automatic approval — no review required.';
    modifiers = ['local only', 'fully offline', 'no data access'];
  }
  if (!tier && type === 'oss' && ossPermissive && !isProduction && noData) {
    tier = 'VL'; reason = name + ' is open source with a permissive license, not in production, and has no data access. Automatic approval.';
    modifiers = ['permissive OSS', 'not in production', 'no data access'];
  }
  if (!tier && type === 'oss' && ossPermissive && devOnly) {
    tier = 'VL'; reason = name + ' is open source with a permissive license used in a dev or test environment only. Automatic approval.';
    modifiers = ['permissive OSS', 'dev/test only'];
  }
  if (!tier && noData && !hasAI && !transmits && !newVendor) {
    tier = 'VL'; reason = name + ' has no data access, no AI functionality, no external transmission, and no vendor relationship. Automatic approval.';
    modifiers = ['no data', 'no AI', 'no transmission', 'no vendor'];
  }
  if (!tier && data.includes('telemetry') && !sensitiveData && !newVendor) {
    tier = 'VL'; reason = name + ' transmits usage telemetry only with no sensitive data and no vendor relationship to establish. Automatic approval.';
    modifiers = ['telemetry only', 'no sensitive data'];
  }

  if (!tier) {
    tier = 'T1'; reason = name + ' does not match a clear high-risk pattern but has unresolved signals. Light internal review is the safe default.';
    modifiers = ['default safe path'];
  }

  lastTier = tier;
  renderResult(name, tier, reason, modifiers, redirect);
  addHistory(name, tier);

  document.getElementById('feedback-area').style.display = 'block';
  document.getElementById('fc-agree').classList.remove('agree');
  document.getElementById('fc-disagree').classList.remove('disagree');
  document.getElementById('feedback-detail').style.display = 'none';
  document.getElementById('feedback-thanks').style.display = 'none';
  document.querySelectorAll('[data-feedback-tier]').forEach(c => c.classList.remove('on'));
  if (document.getElementById('feedback-notes')) document.getElementById('feedback-notes').value = '';
}

function renderResult(name, tier, reason, modifiers, redirect) {
  const meta = {
    VL:   { cls: 'vl',   tierLabel: 'VERY LOW', title: 'Auto-approve' },
    T1:   { cls: 't1',   tierLabel: 'TRACK 1',  title: 'Light review' },
    T2:   { cls: 't2',   tierLabel: 'TRACK 2',  title: 'Medium review' },
    T3:   { cls: 't3',   tierLabel: 'TRACK 3',  title: 'Full review' },
    BU:   { cls: 'bu',   tierLabel: 'BU READOUT', title: 'BU readout required' },
    PROH: { cls: 'proh', tierLabel: 'PROHIBITED', title: 'Cannot be approved' },
  };
  const m = meta[tier];
  const sigs = modifiers.map(s => '<span class="signal-tag">' + s + '</span>').join('');
  const redirHtml = redirect ? '<div class="result-redirect">' + redirect + '</div>' : '';
  document.getElementById('result-area').innerHTML =
    '<div class="result-box ' + m.cls + '">' +
    '<div class="result-tier">' + m.tierLabel + '</div>' +
    '<div class="result-title">' + m.title + '</div>' +
    '<div class="result-reason">' + reason + '</div>' +
    (sigs ? '<div class="signal-tags">' + sigs + '</div>' : '') +
    redirHtml + '</div>';
}

function addHistory(name, tier) {
  const htClass = { VL:'ht-vl', T1:'ht-t1', T2:'ht-t2', T3:'ht-t3', BU:'ht-bu', PROH:'ht-proh' }[tier];
  const htLabel = { VL:'Very low', T1:'Track 1', T2:'Track 2', T3:'Track 3', BU:'BU readout', PROH:'Prohibited' }[tier];
  history.unshift({ name, tier, htClass, htLabel });
  if (history.length > 15) history.pop();
  renderHistory();
}

function renderHistory() {
  const panel = document.getElementById('history-panel');
  const list = document.getElementById('history-list');
  if (!history.length) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  list.innerHTML = history.map(h =>
    '<div class="history-item">' +
    '<span class="hi-name">' + h.name + '</span>' +
    '<span class="hi-badge ' + h.htClass + '">' + h.htLabel + '</span>' +
    '</div>'
  ).join('');
}

function clearHistory() {
  history.length = 0;
  renderHistory();
}