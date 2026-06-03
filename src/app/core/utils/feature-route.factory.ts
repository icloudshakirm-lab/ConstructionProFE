import { Routes } from '@angular/router';
import { CUSTOM_PAGE_LOADERS } from '../constants/custom-page-loaders';
import { FEATURE_MODULES } from '../constants/feature-registry';

export function buildFeatureModuleRoutes(): Routes {
  return FEATURE_MODULES.map((module) => ({
    path: module.routePath,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../../features/module-hub/module-hub.component').then((m) => m.ModuleHubComponent),
        data: { moduleId: module.id }
      },
      ...module.pages.map((page) => ({
        path: page.id,
        loadComponent:
          page.component != null
            ? CUSTOM_PAGE_LOADERS[page.component]
            : () =>
                import('../../shared/components/feature-placeholder/feature-placeholder.component').then(
                  (m) => m.FeaturePlaceholderComponent
                ),
        data: {
          moduleId: module.id,
          pageId: page.id
        }
      }))
    ]
  }));
}
