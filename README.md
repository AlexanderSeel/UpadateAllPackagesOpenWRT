# OpenWrt Package Updater

A small LuCI application that adds **System → Package Updater**.

It detects the package manager automatically:

- OpenWrt **25.12+**: `apk`
- OpenWrt **24.10 and older**: `opkg`

## Features

- Shows OpenWrt release, kernel, package manager and overlay filesystem usage.
- Lists pending package upgrades.
- Refreshes package indexes.
- Runs a bulk package upgrade only after an explicit warning/confirmation.
- Runs the upgrade in the background and displays a live log in LuCI.
- Provides a reboot action with confirmation.
- Uses a narrow rpcd/ucode API; the browser cannot submit arbitrary shell commands.
- Architecture independent (`PKGARCH:=all`).

## Important warning

OpenWrt explicitly warns against blindly mass-upgrading packages with `apk upgrade`
or `opkg upgrade`. The supported way to update the complete base system, kernel and
firmware is **sysupgrade / Attended Sysupgrade / owut**.

This application exists for cases where you intentionally want package-level upgrades,
but it keeps that warning visible before execution.

## Install

Download the correct artifact from the GitHub Release.

### OpenWrt 25.12+

Use the `.apk` built by the official OpenWrt 25.12 SDK:

```sh
apk add --allow-untrusted ./luci-app-openwrt-updater-*.apk
```

The `--allow-untrusted` option is required for locally built packages that are not
signed by an OpenWrt repository key.

### OpenWrt 24.10 and older

Use the `.ipk` built by the official OpenWrt 24.10 SDK:

```sh
opkg install ./luci-app-openwrt-updater_*.ipk
```

After installation, open LuCI and navigate to:

**System → Package Updater**

If the entry is not immediately visible, log out/in or restart `rpcd`.

## Build

This repository uses a normal OpenWrt `package.mk` recipe. Copy/clone it into the
matching OpenWrt SDK as:

```text
package/luci-app-openwrt-updater/
```

Then run:

```sh
make defconfig
make package/luci-app-openwrt-updater/compile V=s
```

The package format is selected by the SDK:

- 25.12 SDK → `.apk`
- 24.10 SDK → `.ipk`

## Releases

`.github/workflows/release.yml` builds both package formats with official OpenWrt SDKs.
The workflow verifies the SDK SHA-256 values before extraction and validates the generated
APK by creating an APK v3 package index with the SDK's own `apk` tool.

## Security model

The LuCI ACL exposes only fixed RPC methods:

Read:
- `status`
- `list_upgrades`
- `job_status`

Write:
- `refresh`
- `start_upgrade`
- `reboot`

There is no generic "execute shell command" RPC endpoint.

## License

Apache-2.0
