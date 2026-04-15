import {
	IconBook,
	IconDeviceDesktop,
	IconFileText,
	IconHome,
	IconLock,
	IconSettings,
	IconShield,
	IconUser,
} from "@tabler/icons-react";
import cn from "classnames";
import React from "react";
import { HasPermission, NavLink } from "src/components";
import { useHealth } from "src/hooks";
import { T } from "src/locale";
import {
	ACCESS_LISTS,
	ADMIN,
	CERTIFICATES,
	DEAD_HOSTS,
	type MANAGE,
	PROXY_HOSTS,
	REDIRECTION_HOSTS,
	type Section,
	STREAMS,
	VIEW,
} from "src/modules/Permissions";

interface MenuItem {
	label: string;
	icon?: React.ElementType;
	to?: string;
	items?: MenuItem[];
	permissionSection?: Section | typeof ADMIN;
	permission?: typeof VIEW | typeof MANAGE;
	divider?: boolean;
}

const menuItems: MenuItem[] = [
	{
		to: "/",
		icon: IconHome,
		label: "dashboard",
	},
	{
		icon: IconDeviceDesktop,
		label: "hosts",
		items: [
			{
				to: "/nginx/proxy",
				label: "proxy-hosts",
				permissionSection: PROXY_HOSTS,
				permission: VIEW,
			},
			{
				to: "/nginx/redirection",
				label: "redirection-hosts",
				permissionSection: REDIRECTION_HOSTS,
				permission: VIEW,
			},
			{
				to: "/nginx/stream",
				label: "streams",
				permissionSection: STREAMS,
				permission: VIEW,
			},
			{
				to: "/nginx/404",
				label: "dead-hosts",
				permissionSection: DEAD_HOSTS,
				permission: VIEW,
			},
		],
	},
	{
		to: "/access",
		icon: IconLock,
		label: "access-lists",
		permissionSection: ACCESS_LISTS,
		permission: VIEW,
	},
	{
		to: "/certificates",
		icon: IconShield,
		label: "certificates",
		permissionSection: CERTIFICATES,
		permission: VIEW,
	},
	{
		to: "/users",
		icon: IconUser,
		label: "users",
		permissionSection: ADMIN,
	},
	{
		icon: IconFileText,
		label: "logs",
		permissionSection: ADMIN,
		items: [
			{ to: "/audit-log", label: "auditlogs", permissionSection: ADMIN },
			{ label: "divider-audit", divider: true },
			{ to: "/logs/access", label: "logs.access", permissionSection: ADMIN },
			{ to: "/logs/errors", label: "logs.errors", permissionSection: ADMIN },
			{ to: "/logs/waf", label: "logs.waf", permissionSection: ADMIN },
			{ to: "/logs/crowdsec", label: "logs.crowdsec", permissionSection: ADMIN },
		],
	},
	{
		to: "/settings",
		icon: IconSettings,
		label: "settings",
		permissionSection: ADMIN,
	},
];

const getMenuItem = (item: MenuItem, onClick?: () => void) => {
	if (item.items && item.items.length > 0) {
		return getMenuDropown(item, onClick);
	}

	return (
		<HasPermission
			key={`item-${item.label}`}
			section={item.permissionSection}
			permission={item.permission || VIEW}
			hideError
		>
			<li className="nav-item">
				<NavLink to={item.to} onClick={onClick}>
					<span className="nav-link-icon d-md-none d-lg-inline-block">
						{item.icon && React.createElement(item.icon, { height: 24, width: 24 })}
					</span>
					<span className="nav-link-title">
						<T id={item.label} />
					</span>
				</NavLink>
			</li>
		</HasPermission>
	);
};

const getMenuDropown = (item: MenuItem, onClick?: () => void) => {
	const cns = cn("nav-item", "dropdown");
	return (
		<HasPermission
			key={`item-${item.label}`}
			section={item.permissionSection}
			permission={item.permission || VIEW}
			hideError
		>
			<li className={cns}>
				<a
					className="nav-link dropdown-toggle"
					href={item.to}
					data-bs-toggle="dropdown"
					data-bs-auto-close="true"
					aria-expanded="false"
					role="button"
				>
					<span className="nav-link-icon d-md-none d-lg-inline-block">
						{React.createElement(item.icon ?? IconDeviceDesktop, { height: 24, width: 24 })}
					</span>
					<span className="nav-link-title">
						<T id={item.label} />
					</span>
				</a>
				<div className="dropdown-menu">
					{item.items?.map((subitem, idx) => {
						if (subitem.divider) {
							return <hr key={`div-${idx}`} className="dropdown-divider" />;
						}
						return (
							<HasPermission
								key={`${idx}-${subitem.to}`}
								section={subitem.permissionSection}
								permission={subitem.permission || VIEW}
								hideError
							>
								<NavLink to={subitem.to} isDropdownItem onClick={onClick}>
									<T id={subitem.label} />
								</NavLink>
							</HasPermission>
						);
					})}
				</div>
			</li>
		</HasPermission>
	);
};

export function SiteMenu() {
	const health = useHealth();
	// When the logs viewer is disabled, fall back to showing Audit-Log as a top-level entry
	// (the unmodified upstream layout). When enabled, the logs dropdown subsumes it.
	const items = health.data?.logsViewer === true
		? menuItems
		: menuItems
			.filter((i) => i.label !== "logs")
			.concat([
				{
					to: "/audit-log",
					icon: IconBook,
					label: "auditlogs",
					permissionSection: ADMIN,
				},
			]);

	const closeMenu = () =>
		setTimeout(() => {
			const navbarToggler = document.querySelector<HTMLElement>(".navbar-toggler");
			const navbarMenu = document.querySelector("#navbar-menu");
			if (navbarToggler && navbarMenu?.classList.contains("show")) {
				navbarToggler.click();
			}
		}, 300);

	return (
		<header className="navbar-expand-md">
			<div className="collapse navbar-collapse" id="navbar-menu">
				<div className="navbar">
					<div className="container-xl">
						<div className="row flex-column flex-md-row flex-fill align-items-center">
							<div className="col">
								<ul className="navbar-nav">
									{items.length > 0 &&
										items.map((item) => {
											return getMenuItem(item, closeMenu);
										})}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	);
}
