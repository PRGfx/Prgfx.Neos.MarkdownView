[![Version](https://poser.pugx.org/prgfx/neos-markdown-view/version)](//packagist.org/packages/prgfx/neos-markdown-view)

# Prgfx.Neos.MarkdownView

> composer require prgfx/neos-markdown-view

Provides an inspector view to render markdown text, e.g. for rendering static help text.

## Options
```yaml
ui:
  inspector:
    views:
      helpText:
        group: helpText
        view: Prgfx.Neos.MarkdownView/MarkdownView
        viewOptions:
          content: |
            **Markdown goes here**
          # optional css class for the element in case you want to add custom styling
          # (include stylesheets in the Neos.Neos.Ui.resources.stylesheets setting)
          className: '...'
          # see react-markdown options
          # tag names of elements that may get converted, defaults to all
          allowedElements: []
          # tag names of elements that should not be converted
          disallowedElements: []
```

## Notes

### Newlines
The script replaces trailing `\\` with trailing double spaces on your content, so newlines work if trailing spaces are removed from your yaml.

### ClientEval
`ClientEval:` is implemented for the (translated) content.
You can use `node`, `parentNode` and `documentNode` in the context.

Additionally, this plugin provides some helpers to the ClientEval context to interact with the guest-frame.

| name        | syntax                                                          | description                                                                                                                                               |
|-------------|-----------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------|
| waitFor     | `(milliseconds)`/`(callback[, retries[, timeout]])`/`(Promise)` | Waits until a timeout has passed, a promise is resolved or a callback has succeeded. Intended to wait for elements becoming available in the guest-frame. |
| htmlElement | `waitFor(htmlElement('element')).then(match => ... )`           | Returns a function querying the selector in the guest-frame                                                                                               |
| nodeHtml    | `waitfor(nodeHtml).then(contentElement => ...)`                 | Tries to retrieve the html element with the data-attributes matching the currently selected node. Might not be found.                                     | 


### Asynchronous Content
If [ClientEval](#clienteval) returns a Promise, the resolved value will be loaded as content.

## Advanced Examples

### Show translation status
Render the translation status into your page
```neosfusion
prototype(Neos.Neos:Page) {
    bodyTag.attributes {
        data-translations = Neos.Fusion:Loop {
            @glue = '\\n'
            items = Neos.Neos:DimensionsMenuItems
            itemRenderer = ${'- ' + (item.node ? '✅' : '❌') + ' ' + item.targetDimensions.language.label}
            @if.inBackend = ${documentNode.context.inBackend}
        }
    }
}
```
Configure Widget
```yaml
Neos.Neos.Document:
  ui:
    inspector:
      groups:
        dimensions:
          label: Dimensions
          icon: language
      views:
        helpText:
          group: dimensions
          label: Translations of this page
          view: Prgfx.Neos.MarkdownView/MarkdownView
          viewOptions:
            content: ClientEval:waitFor(() => document.querySelector('iframe').contentDocument?.body?.dataset.availableDimensions?.replaceAll('\\n','\n'))
```

### Show missing heading levels
Create an external script to keep the node-config sane
```js
const getHeadings = (waitFor, htmlElement) => {
    return waitFor(htmlElement('body script')).then(() => {
        const iframe = document.querySelector('iframe');
        const headings = [...iframe.contentDocument.querySelectorAll('h1,h2,h3,h4,h5,h6')];
        return headings.reduce(({ md, last }, node) => {
            const level = Number.parseInt(node.tagName.substring(1));
            // skipped heading level?
            const status = level > last && level - last > 1 ? '⚠' : ' ';
            md += `- ${level}${status} ${(node.textContent)}\n`;
            return { md, last: level }
        }, { md: '', last: 0 }).md;
    })
};
// make helper globally available
window['markdownWidget_example_headings'] = getHeadings;
```
Load the JS file in your Settings.yaml
```yaml
Neos:
  Neos:
    Ui:
      resources:
        javascript:
          'My.Example':
            resource: resource://My.Example/Public/missing-headings.js
```
Configure the view in the node-type
```yaml
Neos.Neos:Document:
  ui:
    inspector:
      views:
        headings:
          group: document
          label: Missing heading levels
          view: Prgfx.Neos.MarkdownView/MarkdownView
          viewOptions:
            # we pass the context variables to the function exposed from our script
            content: ClientEval:window['markdownWidget_example_headings']?.(waitFor, htmlElement)
```
