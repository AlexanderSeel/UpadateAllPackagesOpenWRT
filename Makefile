include $(TOPDIR)/rules.mk

LUCI_TITLE:=OpenWrt Package Updater
LUCI_DESCRIPTION:=Inspect pending package upgrades and explicitly run apk or opkg package upgrades with progress logging.
LUCI_DEPENDS:=+luci-base
LUCI_PKGARCH:=all

PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=Alexander Seel

include $(TOPDIR)/feeds/luci/luci.mk

# call BuildPackage - OpenWrt buildroot signature
