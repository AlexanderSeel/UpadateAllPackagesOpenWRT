# OpenWrt Package Updater

A small LuCI application that adds **System → Package Updater**.

It automatically detects the package manager:

- OpenWrt **25.12+**: `apk`
- OpenWrt **24.10 and older**: `opkg`

## Features

- Shows the OpenWrt release, kernel, package manager, and overlay filesystem usage.
- Lists pending package upgrades.
- Refreshes package indexes.
- Runs a bulk package upgrade only after an explicit warning and confirmation.
- Runs upgrades in the background and shows a live log in LuCI.
- Provides a reboot action with confirmation.
- Uses a narrow rpcd/ucode API; the browser cannot submit arbitrary shell commands.
- Architecture independent (`LUCI_PKGARCH:=all`).

## Important warning

OpenWrt discourages blindly mass-upgrading base-system packages with `apk upgrade`
or repeated `opkg upgrade`. For the complete base system, kernel, and firmware,
use **sysupgrade / Attended Sysupgrade / owut**.

This application is intended for cases where you deliberately want package-level
upgrades and keeps the warning visible before execution.

## Install

Download the package matching your OpenWrt release from the GitHub Release.

### OpenWrt 25.12+

Use the `.apk` built by the official OpenWrt 25.12 SDK:

```sh
apk add --allow-untrusted ./luci-app-openwrt-updater-*.apk
```

`--allow-untrusted` is required because this project package is not signed by an
official OpenWrt repository key.

### OpenWrt 24.10 and older

Use the `.ipk` built by the official OpenWrt 24.10 SDK:

```sh
opkg install ./luci-app-openwrt-updater_*.ipk
```

After installation, open LuCI and navigate to:

**System → Package Updater**

If the entry does not immediately appear, log out/in to LuCI or restart `rpcd`.

## Build from source

With the matching OpenWrt SDK:

```sh
./scripts/feeds update luci
./scripts/feeds install luci-base
mkdir -p package/luci-app-openwrt-updater
# copy this repository into package/luci-app-openwrt-updater/
make defconfig
make package/luci-app-openwrt-updater/compile V=s
```

The package format is selected by the SDK:

- OpenWrt 25.12 SDK → `.apk`
- OpenWrt 24.10 SDK → `.ipk`

The package recipe uses the LuCI build helper at `$(TOPDIR)/feeds/luci/luci.mk`.

## Releases

`.github/workflows/release.yml` builds both package formats with official OpenWrt SDKs, verifies SDK SHA-256 checksums, validates the generated package formats, and publishes the `.apk`, `.ipk`, source archive, and `SHA256SUMS`.

## Security model

The LuCI ACL exposes only fixed RPC methods.

Read:
- `status`
- `list_upgrades`
- `job_status`

Write:
- `refresh`
- `start_upgrade`
- `reboot`

There is no generic shell-execution RPC endpoint.

## Package layout

```text
Makefile
htdocs/luci-static/resources/view/openwrt-updater.js
root/usr/libexec/openwrt-updater-backend
root/usr/share/luci/menu.d/luci-app-openwrt-updater.json
root/usr/share/rpcd/acl.d/luci-app-openwrt-updater.json
root/usr/share/rpcd/ucode/luci.openwrt-updater
```

## License

Apache-2.0
