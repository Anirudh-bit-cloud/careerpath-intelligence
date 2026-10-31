import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'admin' | 'hrbp' | 'hr_analyst' | 'talent_committee' | 'manager';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  workspaceId: string;
  avatarInitials: string;
}

export interface RoleConfig {
  role: UserRole;
  label: string;
  description: string;
  permittedTabs: string[];
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    role: 'admin',
    label: 'Enterprise Admin',
    description: 'Unrestricted access to analytics, decision workflows, governance, connectors, and administration',
    permittedTabs: [
      'overview',
      'reports',
      'clusters',
      'promotion-gap',
      'trends',
      'manager-insights',
      'retention-opportunities',
      'succession',
      'committee',
      'impact-estimator',
      'employees',
      'fairness-audit',
      'trust-center',
      'connectors',
      'data-management',
      'design-system',
      'settings',
      'my-team'
    ]
  },
  hrbp: {
    role: 'hrbp',
    label: 'HR Business Partner',
    description: 'Operational talent review, retention intervention, succession planning, and cohort fairness',
    permittedTabs: [
      'overview',
      'reports',
      'clusters',
      'promotion-gap',
      'trends',
      'manager-insights',
      'retention-opportunities',
      'succession',
      'committee',
      'employees',
      'fairness-audit',
      'trust-center',
      'settings',
      'my-team'
    ]
  },
  hr_analyst: {
    role: 'hr_analyst',
    label: 'People Analytics Analyst',
    description: 'Workforce intelligence, clustering re-runs, gap modeling, ROI projections, and data audits',
    permittedTabs: [
      'overview',
      'reports',
      'clusters',
      'promotion-gap',
      'trends',
      'manager-insights',
      'impact-estimator',
      'employees',
      'fairness-audit',
      'trust-center',
      'data-management',
      'settings'
    ]
  },
  talent_committee: {
    role: 'talent_committee',
    label: 'Talent Committee Member',
    description: 'Calibrated succession review, retention candidate deliberation, and committee decisions',
    permittedTabs: [
      'overview',
      'reports',
      'retention-opportunities',
      'succession',
      'committee',
      'employees',
      'trust-center'
    ]
  },
  manager: {
    role: 'manager',
    label: 'People Manager',
    description: 'Direct team progression review, supportive 1-on-1 development conversations, and follow-up tracking',
    permittedTabs: [
      'my-team',
      'overview',
      'trust-center'
    ]
  }
};

const DEFAULT_USERS: Record<UserRole, UserProfile> = {
  admin: {
    id: 'usr-admin-01',
    email: 'admin@paloaltonetworks.com',
    name: 'Sarah Chen',
    role: 'admin',
    workspaceId: 'default',
    avatarInitials: 'SC'
  },
  hrbp: {
    id: 'usr-hrbp-01',
    email: 'hrbp.director@paloaltonetworks.com',
    name: 'Marcus Vance',
    role: 'hrbp',
    workspaceId: 'default',
    avatarInitials: 'MV'
  },
  hr_analyst: {
    id: 'usr-analyst-01',
    email: 'analytics.lead@paloaltonetworks.com',
    name: 'Elena Rostova',
    role: 'hr_analyst',
    workspaceId: 'default',
    avatarInitials: 'ER'
  },
  talent_committee: {
    role: 'talent_committee',
    id: 'usr-comm-01',
    email: 'committee.chair@paloaltonetworks.com',
    name: 'David Sterling',
    workspaceId: 'default',
    avatarInitials: 'DS'
  },
  manager: {
    id: 'usr-mgr-01',
    email: 'manager@paloaltonetworks.com',
    name: 'Alex Morgan',
    role: 'manager',
    workspaceId: 'default',
    avatarInitials: 'AM'
  }
};

interface AuthContextType {
  user: UserProfile;
  role: UserRole;
  setRole: (role: UserRole) => void;
  canAccessTab: (tabId: string) => boolean;
  permittedTabs: string[];
  roleConfig: RoleConfig;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem('cp_active_role') as UserRole;
      if (stored && ROLE_CONFIGS[stored]) {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'admin';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    try {
      localStorage.setItem('cp_active_role', newRole);
    } catch {
      // ignore
    }
  };

  const user = DEFAULT_USERS[role];
  const roleConfig = ROLE_CONFIGS[role];
  const permittedTabs = roleConfig.permittedTabs;

  const canAccessTab = (tabId: string): boolean => {
    return permittedTabs.includes(tabId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        setRole,
        canAccessTab,
        permittedTabs,
        roleConfig
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
