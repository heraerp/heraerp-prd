import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#5A2A40',
  emerald: '#0F6F5C'
}

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md p-1 text-muted-foreground",
      className
    )}
    style={{
      backgroundColor: COLORS.charcoalDark,
      border: `1px solid ${COLORS.bronze}40`
    }}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    style={{
      color: COLORS.bronze
    }}
    {...props}
    data-state-styles={{
      active: {
        background: `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
        color: COLORS.black,
        boxShadow: '0 1px 3px rgba(212, 175, 55, 0.3)'
      },
      inactive: {
        color: COLORS.bronze,
        backgroundColor: 'transparent'
      }
    }}
    onMouseEnter={(e) => {
      const target = e.currentTarget;
      if (target.getAttribute('data-state') !== 'active') {
        target.style.backgroundColor = `${COLORS.gold}10`;
        target.style.color = COLORS.lightText;
      }
    }}
    onMouseLeave={(e) => {
      const target = e.currentTarget;
      if (target.getAttribute('data-state') !== 'active') {
        target.style.backgroundColor = 'transparent';
        target.style.color = COLORS.bronze;
      }
    }}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    style={{
      color: COLORS.lightText
    }}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

// Add a useEffect to handle the active state styling
const useLuxeTabsEffect = () => {
  React.useEffect(() => {
    // Apply active state styling
    const applyActiveStyles = () => {
      const activeTriggers = document.querySelectorAll('[role="tab"][data-state="active"]');
      activeTriggers.forEach((trigger) => {
        const element = trigger as HTMLElement;
        element.style.background = `linear-gradient(135deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`;
        element.style.color = COLORS.black;
        element.style.boxShadow = '0 1px 3px rgba(212, 175, 55, 0.3)';
      });
      
      const inactiveTriggers = document.querySelectorAll('[role="tab"][data-state="inactive"]');
      inactiveTriggers.forEach((trigger) => {
        const element = trigger as HTMLElement;
        if (!element.matches(':hover')) {
          element.style.background = 'transparent';
          element.style.color = COLORS.bronze;
          element.style.boxShadow = 'none';
        }
      });
    };

    // Apply styles initially
    applyActiveStyles();

    // Create observer to watch for state changes
    const observer = new MutationObserver(applyActiveStyles);
    const tabsElements = document.querySelectorAll('[role="tab"]');
    tabsElements.forEach((element) => {
      observer.observe(element, { attributes: true, attributeFilter: ['data-state'] });
    });

    return () => observer.disconnect();
  }, []);
};

export { Tabs, TabsList, TabsTrigger, TabsContent, useLuxeTabsEffect }