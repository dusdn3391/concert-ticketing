import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAdminBadgeStore } from '@/stores/badges';
import { useRouter } from 'next/router';
import { useVenueStore } from '@/stores/venue';

import styles from './sidebar.module.css';
import { Icons } from '../ui/Icons';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  subItems?: MenuItem[];
}

export default function Sidebar({ isOpen, onToggle, isMobile = false }: SidebarProps) {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>(['concerts']);

  // 👇 전역에서 개수 읽기
  const { concertCount } = useAdminBadgeStore();

  const menuItems: MenuItem[] = [
    // {
    //   id: 'dashboard',
    //   label: '대시보드',
    //   href: '/admin',
    //   icon: <Icons.BarChart className={styles.iconSvg} />,
    // },
    {
      id: 'concerts',
      label: '공연장 관리', // 필요하면 '콘서트'로 라벨 변경 가능
      href: '',
      icon: <Icons.MapPin className={styles.iconSvg} />,
      badge: concertCount, // 👈 여기!
      subItems: [
        {
          id: 'concerts-create',
          label: '새 공연장 생성',
          href: '/admin/concerts/create',
          icon: <Icons.Plus className={styles.iconSvg} />,
        },
        {
          id: 'concerts-list',
          label: '공연장 목록',
          href: '/admin/concerts',
          icon: <Icons.Grid className={styles.iconSvg} />,
        },
      ],
    },
    {
      id: 'performers',
      label: '출연진 관리',
      href: '',
      icon: <Icons.Users className={styles.iconSvg} />,
      subItems: [
        {
          id: 'performers-create',
          label: '새 출연진 등록',
          href: '/admin/performers/create',
          icon: <Icons.Plus className={styles.iconSvg} />,
        },
        {
          id: 'performers-list',
          label: '출연진 목록',
          href: '/admin/performers',
          icon: <Icons.User className={styles.iconSvg} />,
        },
      ],
    },
  ];

  const toggleExpand = (itemId: string): void => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId],
    );
  };

  const isActive = (
    href: string,
    subItems?: MenuItem[],
    hasSubItems: boolean = false,
  ): boolean => {
    const currentPath = router.pathname;

    if (href === '/admin') {
      return currentPath === href;
    }

    // 서브메뉴가 있는 경우 (부모 메뉴)
    if (hasSubItems && subItems) {
      // 현재 경로가 부모 메뉴의 정확한 경로와 일치하거나
      // 서브메뉴 중 하나의 경로와 일치하는 경우 활성화
      const isParentActive = currentPath === href;
      const isSubItemActive = subItems.some((subItem) => currentPath === subItem.href);
      return isParentActive || isSubItemActive;
    }

    // 서브메뉴가 없는 경우 또는 서브메뉴 아이템인 경우
    return currentPath === href;
  };

  const handleMenuClick = () => {
    // 모바일에서 메뉴 클릭 시 사이드바 닫기
    if (isMobile && isOpen) {
      onToggle();
    }
  };

  // 사이드바가 닫혔을 때 렌더링할 메뉴 아이템들을 생성
  const getMenuItemsForRender = (): MenuItem[] => {
    if (isOpen) {
      return menuItems;
    }

    // 사이드바가 닫혔을 때: 서브메뉴가 있는 항목은 서브메뉴들로 대체
    const flattenedItems: MenuItem[] = [];

    menuItems.forEach((item) => {
      if (item.subItems && item.subItems.length > 0) {
        // 서브메뉴가 있는 경우 서브메뉴들을 추가
        flattenedItems.push(...item.subItems);
      } else {
        // 서브메뉴가 없는 경우 그대로 추가
        flattenedItems.push(item);
      }
    });

    return flattenedItems;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0): React.ReactNode => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.href, item.subItems, hasSubItems);
    const isSubItem = level > 0;

    if (!isOpen && hasSubItems) {
      return null;
    }

    const buttonClasses = [
      hasSubItems ? styles.menuButton : styles.menuLink,
      isOpen ? styles.open : styles.closed,
      isSubItem ? styles.subItem : '',
      active ? styles.active : '',
    ]
      .filter(Boolean)
      .join(' ');

    const iconClasses = [styles.menuIcon, isOpen ? styles.open : styles.closed].join(' ');

    const labelClasses = [styles.menuLabel, !isOpen ? styles.hidden : ''].join(' ');

    const rightClasses = [styles.menuRight, !isOpen ? styles.hidden : ''].join(' ');

    return (
      <div key={item.id} className={isSubItem ? styles.subItem : styles.menuItem}>
        {/* 메인 메뉴 아이템 */}
        {hasSubItems ? (
          <button
            onClick={() => toggleExpand(item.id)}
            className={buttonClasses}
            aria-expanded={isExpanded}
            aria-label={`${item.label} ${isExpanded ? '접기' : '펼치기'}`}
          >
            <span className={iconClasses}>{item.icon}</span>

            {isOpen && (
              <>
                <span className={labelClasses}>{item.label}</span>

                <div className={rightClasses}>
                  {item.badge && (
                    <span
                      className={`${styles.badge} ${active ? styles.active : styles.inactive}`}
                    >
                      {item.badge}
                    </span>
                  )}

                  <div
                    className={`${styles.expandIcon} ${active ? styles.active : styles.inactive} ${
                      isExpanded ? styles.expanded : styles.collapsed
                    }`}
                  >
                    <Icons.ArrowRight />
                  </div>
                </div>
              </>
            )}
          </button>
        ) : (
          <Link
            href={item.href}
            className={buttonClasses}
            onClick={handleMenuClick}
            aria-label={item.label}
          >
            <span className={iconClasses}>{item.icon}</span>

            {isOpen && (
              <>
                <span className={labelClasses}>{item.label}</span>

                {item.badge && (
                  <div className={rightClasses}>
                    <span
                      className={`${styles.badge} ${active ? styles.active : styles.inactive}`}
                    >
                      {item.badge}
                    </span>
                  </div>
                )}
              </>
            )}
          </Link>
        )}

        {/* 서브 메뉴 아이템들 */}
        {hasSubItems && isExpanded && isOpen && (
          <div className={styles.subMenu}>
            {item.subItems?.map((subItem) => renderMenuItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const sidebarClasses = [
    styles.sidebar,
    isOpen ? styles.open : styles.closed,
    isMobile && isOpen ? styles.mobileOpen : '',
  ]
    .filter(Boolean)
    .join(' ');

  const headerClasses = [styles.header, isOpen ? styles.open : styles.closed].join(' ');

  const logoClasses = [styles.logo, isOpen ? styles.open : ''].join(' ');

  const logoTextClasses = [styles.logoText, !isOpen ? styles.hidden : ''].join(' ');

  const footerClasses = [styles.footer, isOpen ? styles.open : styles.closed].join(' ');

  const footerContentClasses = [styles.footerContent, !isOpen ? styles.hidden : ''].join(
    ' ',
  );

  return (
    <aside className={sidebarClasses} role='navigation' aria-label='메인 네비게이션'>
      {/* 로고 영역 */}
      <div className={headerClasses}>
        <div className={logoClasses}>
          <Icons.Music size={32} />
        </div>

        {isOpen && (
          <div className={logoTextClasses}>
            <div className={styles.logoTitle}>Concert Manager</div>
            <div className={styles.logoSubtitle}>콘서트장 관리 시스템</div>
          </div>
        )}
      </div>

      {/* 메뉴 영역 */}
      <nav className={styles.nav}>
        {getMenuItemsForRender().map((item) => renderMenuItem(item))}
      </nav>

      {/* 하단 정보 */}
      <div className={footerClasses}>
        {isOpen ? (
          <div className={footerContentClasses}>
            <div className={styles.version}>버전 1.0.0</div>
            <div className={styles.lastUpdate}>마지막 업데이트: 2025.06.10</div>
          </div>
        ) : (
          <div className={styles.footerPlaceholder} />
        )}
      </div>
    </aside>
  );
}
