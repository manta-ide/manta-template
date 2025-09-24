'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

import { useVars } from '../../.manta/varsHmr';

import { useActiveSection } from '@/components/active-section-provider';
import { Button } from '@/components/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/dialog';
import { Icons } from '@/components/icons';
import { ThemeToggle } from '@/components/theme-toggle';

export const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { activeSection, setActiveSection, setTimeOfLastClick } =
    useActiveSection();

  // Wire CMS properties
  const [vars] = useVars();
  const headerVars = (vars['header'] as Record<string, unknown>) || {};

  // Navigation links
  const navigationLinks = (headerVars['navigation-links'] as Array<{
    name: string;
    hash: string;
  }>) || [
    { name: 'Home', hash: '#home' },
    { name: 'About', hash: '#about' },
    { name: 'Experience', hash: '#experience' },
    { name: 'Projects', hash: '#projects' },
    { name: 'Contact', hash: '#contact' },
  ];

  // Mobile menu properties
  const mobileMenuLabel = (headerVars['mobile-menu-label'] as string) || 'Menu';
  const mobileDialogTitle =
    (headerVars['mobile-dialog-title'] as string) || 'Navigation';

  // Header styles
  const headerStyles =
    (headerVars['header-styles'] as Record<string, unknown>) || {};
  const backgroundOpacity = Number(headerStyles['background-opacity']) || 80;
  const borderRadius = (headerStyles['border-radius'] as string) || 'full';
  const backdropBlur = Boolean(headerStyles['backdrop-blur']) ?? true;
  const stickyPosition = Boolean(headerStyles['sticky-position']) ?? true;

  // Animation settings
  const animationSettings =
    (headerVars['animation-settings'] as Record<string, unknown>) || {};
  const entranceAnimation =
    Boolean(animationSettings['entrance-animation']) ?? true;
  const activeIndicator =
    Boolean(animationSettings['active-indicator']) ?? true;
  const springStiffness = Number(animationSettings['spring-stiffness']) || 380;
  const springDamping = Number(animationSettings['spring-damping']) || 30;

  // Layout spacing
  const layoutSpacing =
    (headerVars['layout-spacing'] as Record<string, unknown>) || {};
  const topMargin = Number(layoutSpacing['top-margin']) || 5;
  const desktopTopMargin = Number(layoutSpacing['desktop-top-margin']) || 10;
  const horizontalPadding = Number(layoutSpacing['horizontal-padding']) || 2;
  const verticalPadding = Number(layoutSpacing['vertical-padding']) || 3;
  const navGap = Number(layoutSpacing['nav-gap']) || 5;

  // Mobile features
  const mobileFeatures =
    (headerVars['mobile-features'] as Record<string, unknown>) || {};
  const showThemeToggle = Boolean(mobileFeatures['show-theme-toggle']) ?? true;
  const showMobileMenu = Boolean(mobileFeatures['show-mobile-menu']) ?? true;
  const dialogWidth = Number(mobileFeatures['dialog-width']) || 90;

  // Generate dynamic classes
  const getBorderRadiusClass = (radius: string) => {
    const radiusMap: Record<string, string> = {
      none: 'rounded-none',
      small: 'rounded-sm',
      medium: 'rounded-md',
      large: 'rounded-lg',
      full: 'rounded-full',
    };
    return radiusMap[radius] || 'rounded-full';
  };

  return (
    <motion.header
      initial={
        entranceAnimation ? { y: -100, opacity: 0 } : { y: 0, opacity: 1 }
      }
      animate={{ y: 0, opacity: 1 }}
      className={`z-20 flex items-center gap-2 ${
        stickyPosition ? 'sticky' : 'relative'
      } ${getBorderRadiusClass(borderRadius)} sm:border ${
        backdropBlur ? 'sm:backdrop-blur-sm' : ''
      } ${backgroundOpacity > 0 ? 'sm:bg-background/80' : ''}`}
      style={
        {
          top: `${topMargin * 0.25}rem`,
          marginTop: `${topMargin * 0.25}rem`,
          marginBottom: `${topMargin * 0.25}rem`,
          paddingLeft: `${horizontalPadding * 0.25}rem`,
          paddingRight: `${horizontalPadding * 0.25}rem`,
          paddingTop: `${verticalPadding * 0.25}rem`,
          paddingBottom: `${verticalPadding * 0.25}rem`,
          '--top-margin-desktop': `${desktopTopMargin * 0.25}rem`,
        } as React.CSSProperties
      }
    >
      {showMobileMenu && (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              style={{
                backgroundColor:
                  backgroundOpacity > 0
                    ? `hsl(var(--background) / ${backgroundOpacity / 100})`
                    : undefined,
              }}
              className={`${backdropBlur ? 'backdrop-blur-sm' : ''} sm:hidden`}
            >
              {mobileMenuLabel} <Icons.chevronDown className="ml-2 size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent
            className="text-muted-foreground max-h-screen rounded"
            style={{ width: `${dialogWidth}%` }}
          >
            <DialogHeader>
              <DialogTitle className="text-md self-start font-medium">
                {mobileDialogTitle}
              </DialogTitle>
            </DialogHeader>
            <nav>
              <ul>
                {navigationLinks.map(({ name, hash }) => (
                  <li
                    onClick={() => setIsOpen(false)}
                    key={name}
                    className="border-muted-foreground/10 py-3 text-sm [&:not(:last-child)]:border-b"
                  >
                    <Link className="block" href={hash}>
                      {name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </DialogContent>
        </Dialog>
      )}
      {showThemeToggle && (
        <ThemeToggle
          style={{
            backgroundColor:
              backgroundOpacity > 0
                ? `hsl(var(--background) / ${backgroundOpacity / 100})`
                : undefined,
          }}
          className={`${backdropBlur ? 'backdrop-blur-sm' : ''} sm:hidden`}
        />
      )}
      <nav className="text-muted-foreground hidden text-sm sm:block">
        <ul className="flex" style={{ gap: `${navGap * 0.25}rem` }}>
          {navigationLinks.map(({ name, hash }) => (
            <li key={name}>
              <Link
                href={hash}
                className="hover:text-foreground relative px-4 py-2 transition-colors"
                onClick={() => {
                  setActiveSection(name as any);
                  setTimeOfLastClick(Date.now());
                }}
              >
                {name}
                {activeIndicator && name === activeSection && (
                  <motion.span
                    className="bg-muted absolute inset-0 -z-10 rounded-full"
                    layoutId="activeSection"
                    transition={{
                      type: 'spring',
                      stiffness: springStiffness,
                      damping: springDamping,
                    }}
                  ></motion.span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </motion.header>
  );
};
