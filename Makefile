include $(TOPDIR)/rules.mk

PKG_NAME:=luci-app-openwrt-updater
PKG_VERSION:=1.0.0
PKG_RELEASE:=1
PKG_LICENSE:=Apache-2.0
PKG_MAINTAINER:=Alexander Seel

include $(INCLUDE_DIR)/package.mk

define Package/luci-app-openwrt-updater
  SECTION:=luci
  CATEGORY:=LuCI
  TITLE:=OpenWrt Package Updater
  DEPENDS:=+luci-base
  PKGARCH:=all
endef

define Package/luci-app-openwrt-updater/description
 LuCI page for inspecting pending package upgrades and explicitly
 running apk upgrade or opkg upgrades with progress logging.
endef

define Build/Compile
endef

define Build/Configure
endef

define Package/luci-app-openwrt-updater/install
	$(INSTALL_DIR) $(1)/www/luci-static/resources/view
	$(INSTALL_DATA) ./files/www/luci-static/resources/view/openwrt-updater.js \
		$(1)/www/luci-static/resources/view/openwrt-updater.js

	$(INSTALL_DIR) $(1)/usr/share/luci/menu.d
	$(INSTALL_DATA) ./files/usr/share/luci/menu.d/luci-app-openwrt-updater.json \
		$(1)/usr/share/luci/menu.d/luci-app-openwrt-updater.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/acl.d
	$(INSTALL_DATA) ./files/usr/share/rpcd/acl.d/luci-app-openwrt-updater.json \
		$(1)/usr/share/rpcd/acl.d/luci-app-openwrt-updater.json

	$(INSTALL_DIR) $(1)/usr/share/rpcd/ucode
	$(INSTALL_BIN) ./files/usr/share/rpcd/ucode/luci.openwrt-updater \
		$(1)/usr/share/rpcd/ucode/luci.openwrt-updater

	$(INSTALL_DIR) $(1)/usr/libexec
	$(INSTALL_BIN) ./files/usr/libexec/openwrt-updater-backend \
		$(1)/usr/libexec/openwrt-updater-backend
endef

define Package/luci-app-openwrt-updater/postinst
#!/bin/sh
[ -n "$${IPKG_INSTROOT}" ] || {
	rm -f /tmp/luci-indexcache
	rm -rf /tmp/luci-modulecache 2>/dev/null || true
	/etc/init.d/rpcd restart 2>/dev/null || true
}
exit 0
endef

$(eval $(call BuildPackage,luci-app-openwrt-updater))
