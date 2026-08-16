'use strict';
'require view';
'require rpc';
'require ui';
'require poll';

function kv(text) {
	var out = {};
	(text || '').split(/\r?\n/).forEach(function(line) {
		var p = line.indexOf('=');
		if (p > 0)
			out[line.substring(0, p)] = line.substring(p + 1);
	});
	return out;
}

function parseJob(text) {
	var marker = '\n---LOG---\n';
	var p = (text || '').indexOf(marker);
	if (p < 0)
		return { state: 'unknown', log: text || '' };

	var h = kv(text.substring(0, p));
	return { state: h.state || 'unknown', log: text.substring(p + marker.length) };
}

function countLines(text) {
	return (text || '').split(/\r?\n/).filter(function(x) { return x.trim() !== ''; }).length;
}

return view.extend({
	callStatus: rpc.declare({ object: 'luci.openwrt_updater', method: 'status', expect: {} }),
	callList: rpc.declare({ object: 'luci.openwrt_updater', method: 'list_upgrades', expect: {} }),
	callJob: rpc.declare({ object: 'luci.openwrt_updater', method: 'job_status', expect: {} }),
	callRefresh: rpc.declare({ object: 'luci.openwrt_updater', method: 'refresh', expect: {} }),
	callUpgrade: rpc.declare({ object: 'luci.openwrt_updater', method: 'start_upgrade', expect: {} }),
	callReboot: rpc.declare({ object: 'luci.openwrt_updater', method: 'reboot', expect: {} }),

	load: function() {
		return Promise.all([
			L.resolveDefault(this.callStatus(), { code: 1, stdout: '' }),
			L.resolveDefault(this.callList(), { code: 1, stdout: '' }),
			L.resolveDefault(this.callJob(), { code: 1, stdout: '' })
		]);
	},

	updateJob: function() {
		var stateNode = document.getElementById('owu-state');
		var logNode = document.getElementById('owu-log');
		if (!stateNode || !logNode)
			return Promise.resolve();

		return L.resolveDefault(this.callJob(), { code: 1, stdout: '' }).then(function(res) {
			var job = parseJob(res.stdout || '');
			stateNode.textContent = job.state;
			logNode.textContent = job.log || _('No upgrade log yet.');
		});
	},

	handleRefresh: function() {
		ui.showModal(_('Refreshing package lists'), [
			E('p', { 'class': 'spinning' }, _('Downloading package indexes…'))
		]);

		return this.callRefresh().then(function(res) {
			ui.hideModal();
			if (res.code !== 0)
				throw new Error(res.stdout || _('Package index refresh failed.'));
			window.location.reload();
		}).catch(function(err) {
			ui.hideModal();
			ui.addNotification(null, E('p', {}, err.message || String(err)), 'error');
		});
	},

	handleUpgradeConfirmed: function() {
		ui.hideModal();
		return this.callUpgrade().then(L.bind(function(res) {
			if (res.code !== 0)
				throw new Error(res.stdout || _('Unable to start upgrade.'));
			ui.addNotification(null, E('p', {}, _('Upgrade started. Follow the log below.')), 'info');
			return this.updateJob();
		}, this)).catch(function(err) {
			ui.addNotification(null, E('p', {}, err.message || String(err)), 'error');
		});
	},

	handleUpgrade: function() {
		ui.showModal(_('Confirm bulk package upgrade'), [
			E('div', { 'class': 'alert-message warning' }, [
				E('strong', {}, _('Warning: ')),
				_('OpenWrt explicitly discourages blind bulk package upgrades. A firmware/sysupgrade or Attended Sysupgrade is the supported way to update the complete system.')
			]),
			E('p', {}, _('Continue only if you intentionally want to run apk upgrade or upgrade all packages reported by opkg.')),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')), ' ',
				E('button', {
					'class': 'btn cbi-button-negative important',
					'click': ui.createHandlerFn(this, 'handleUpgradeConfirmed')
				}, _('Upgrade all packages'))
			])
		]);
	},

	handleRebootConfirmed: function() {
		ui.hideModal();
		return this.callReboot().then(function(res) {
			if (res.code !== 0)
				throw new Error(res.stdout || _('Unable to reboot router.'));
			ui.addNotification(null, E('p', {}, _('Router is rebooting.')), 'info');
		});
	},

	handleReboot: function() {
		ui.showModal(_('Confirm reboot'), [
			E('p', {}, _('Reboot the router now?')),
			E('div', { 'class': 'right' }, [
				E('button', { 'class': 'btn', 'click': ui.hideModal }, _('Cancel')), ' ',
				E('button', {
					'class': 'btn cbi-button-negative important',
					'click': ui.createHandlerFn(this, 'handleRebootConfirmed')
				}, _('Reboot'))
			])
		]);
	},

	render: function(data) {
		var status = kv((data[0] || {}).stdout || '');
		var upgrades = (data[1] || {}).stdout || '';
		var job = parseJob((data[2] || {}).stdout || '');
		var count = countLines(upgrades);

		poll.add(L.bind(this.updateJob, this), 2);

		return E('div', {}, [
			E('h2', {}, _('OpenWrt Package Updater')),
			E('p', { 'class': 'cbi-section-descr' },
				_('Inspect pending updates and explicitly start package upgrades.')),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('System status')),
				E('table', { 'class': 'table' }, [
					E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td left', 'width': '30%' }, _('OpenWrt')), E('td', { 'class': 'td left' }, status.release || _('Unknown')) ]),
					E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td left' }, _('Kernel')), E('td', { 'class': 'td left' }, status.kernel || _('Unknown')) ]),
					E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td left' }, _('Package manager')), E('td', { 'class': 'td left' }, status.manager || _('Unknown')) ]),
					E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td left' }, _('Filesystem')), E('td', { 'class': 'td left' }, E('code', {}, status.overlay || _('Unknown'))) ]),
					E('tr', { 'class': 'tr' }, [ E('td', { 'class': 'td left' }, _('Upgrade job')), E('td', { 'class': 'td left' }, E('span', { 'id': 'owu-state' }, job.state)) ])
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Pending package upgrades (%d)').format(count)),
				E('pre', { 'style': 'max-height:320px;overflow:auto;white-space:pre-wrap' }, upgrades || _('No packages listed.')),
				E('div', { 'class': 'cbi-page-actions' }, [
					E('button', { 'class': 'btn cbi-button-action', 'click': ui.createHandlerFn(this, 'handleRefresh') }, _('Refresh package lists')), ' ',
					E('button', { 'class': 'btn cbi-button-negative important', 'click': ui.createHandlerFn(this, 'handleUpgrade') }, _('Upgrade all packages')), ' ',
					E('button', { 'class': 'btn', 'click': ui.createHandlerFn(this, 'handleReboot') }, _('Reboot router'))
				])
			]),

			E('div', { 'class': 'cbi-section' }, [
				E('h3', {}, _('Upgrade log')),
				E('pre', { 'id': 'owu-log', 'style': 'max-height:420px;overflow:auto;white-space:pre-wrap' }, job.log || _('No upgrade log yet.'))
			])
		]);
	},

	handleSaveApply: null,
	handleSave: null,
	handleReset: null
});
