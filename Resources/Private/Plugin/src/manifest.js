import manifest from '@neos-project/neos-ui-extensibility';
import MarkdownView from './view';

manifest('Prgfx.Neos.MarkdownView', {}, (globalRegistry) => {
    const viewsRegistry = globalRegistry.get('inspector').get('views');
    viewsRegistry.set('Prgfx.Neos.MarkdownView/MarkdownView', {
        component: MarkdownView,
    });
});
