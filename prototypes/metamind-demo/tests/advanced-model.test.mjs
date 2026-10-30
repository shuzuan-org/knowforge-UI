import test from 'node:test';
import assert from 'node:assert/strict';
import { migrateAdvanced, packageLibraries, validatePackage, updatePackageEnabled, resolveAgent, graphGroups,resolveActiveMethod,organizingMethodSnapshot,methodLabel,organizingSettingsPath } from '../src/advanced-model.mjs';

test('advanced migration preserves existing records and migrates old agents once', () => {
  const packages = [{ id: 'p1', libraryIds: ['a'], enabled: true }];
  const base = { version: 2, customLibraries: [{ id: 'a' }], sources: [{ id: 's1' }] };
  const migrated = migrateAdvanced(base, [{ name: '原有角色', description: '原有描述' }], packages);
  assert.equal(migrated.agentProfiles[0].name, '原有角色');
  assert.equal(migrated.agentProfiles[0].description, '原有描述');
  assert.deepEqual(migrated.sources, base.sources);
  assert.equal(migrated.resourcePackages[0].id, 'p1');
  const edited = { ...migrated, agentProfiles: [{ id: 'custom', name: '修改后的角色' }], resourcePackages: [], defaultPackageId: '' };
  assert.deepEqual(migrateAdvanced(edited, [{ name: '不应再重复导入' }], packages), edited);
});

test('packages reject blank names and missing libraries, with no accidental range expansion', () => {
  const libraries = [{ id: 'a' }, { id: 'b' }];
  assert.match(validatePackage({ name: ' ', libraryIds: ['a'] }, libraries), /名称/);
  assert.match(validatePackage({ name: '资料包', libraryIds: ['removed'] }, libraries), /至少/);
  assert.equal(validatePackage({ name: '资料包', libraryIds: ['a', 'removed'] }, libraries), '');
  assert.deepEqual(packageLibraries({ libraryIds: ['a', 'removed'] }, libraries), [{ id: 'a' }]);
});

test('disabling the default package clears that default without removing any content', () => {
  const state = { resourcePackages: [{ id: 'a', enabled: true, libraryIds: ['library-a'] }, { id: 'b', enabled: true, libraryIds: ['library-b'] }], defaultPackageId: 'a', sources: [{ id: 'source' }] };
  const disabled = updatePackageEnabled(state, 'a', false);
  assert.equal(disabled.defaultPackageId, '');
  assert.equal(disabled.resourcePackages[0].enabled, false);
  assert.deepEqual(disabled.resourcePackages[0].libraryIds, ['library-a']);
  assert.deepEqual(disabled.sources, state.sources);
  assert.equal(state.resourcePackages[0].enabled, true);
  assert.equal(updatePackageEnabled(disabled, 'a', true).resourcePackages[0].enabled, true);
});

test('graph filtering encodes actual directory membership and keeps document IDs', () => {
  const docs = [{ id: '1', title: '字体层级', category: '排版' }, { id: '2', title: '字号', category: '排版' }, { id: '3', title: '品牌色', category: '色彩' }];
  assert.deepEqual(graphGroups(docs).map(g => [g.id, g.documents.map(d => d.id)]), [['排版', ['1', '2']], ['色彩', ['3']]]);
  assert.deepEqual(graphGroups(docs, ' 字体 ').map(g => g.documents.map(d => d.id)), [['1']]);
  assert.equal(graphGroups(docs, '不存在').length, 0);
  assert.equal(graphGroups(docs, '排版')[0].documents.length, 2);
});

test('all five system templates and custom profiles resolve; unknown IDs safely fall back', () => {
  assert.equal(resolveAgent('onboarding').name, '学习整理');
  const custom = { id: 'c1', name: '我的研究员', strategy: '保留原始证据' };
  assert.deepEqual(resolveAgent('c1', [custom]), custom);
  assert.equal(resolveAgent('removed', [custom]).id, 'general');
});

test('new imports default to general and do not reuse archived or missing custom methods',()=>{
  const profiles=[{id:'custom',name:'访谈整理',strategy:'保留原话'},{id:'archived',name:'旧方式',archived:true}];
  assert.equal(resolveActiveMethod(undefined,profiles).id,'general');
  assert.equal(resolveActiveMethod('archived',profiles).id,'general');
  assert.equal(resolveActiveMethod('missing',profiles).name,'通用整理');
  assert.equal(resolveActiveMethod('custom',profiles).name,'访谈整理');
  const snapshot=organizingMethodSnapshot('custom',profiles);profiles[0].strategy='后来修改的规则';
  assert.equal(snapshot.agentRules.strategy,'保留原话');assert.equal(snapshot.method,'custom');assert.equal(snapshot.agentName,'访谈整理');
});

test('legacy rule snapshots display current system names without mutating user-defined names or saved rules',()=>{
  const old={id:'general',name:'知识聚焦',strategy:'原始规则'};
  assert.equal(methodLabel(old.id,old.name),'通用整理');assert.equal(old.name,'知识聚焦');assert.equal(old.strategy,'原始规则');
  assert.equal(methodLabel('custom','知识聚焦'),'知识聚焦');
  assert.equal(methodLabel('general','我自己命名的方式'),'我自己命名的方式');
});

test('old agent bookmarks enter optional upload settings and retain the intended theme and explicit method',()=>{
  const path=organizingSettingsPath(new URL('http://local/agents?library=local-a&tab=mine&agent=research'));
  const url=new URL(path,'http://local');assert.equal(url.pathname,'/upload');assert.equal(url.searchParams.get('methods'),'1');
  assert.equal(url.searchParams.get('methodTab'),'mine');assert.equal(url.searchParams.get('library'),'local-a');assert.equal(url.searchParams.get('agent'),'research');
});
