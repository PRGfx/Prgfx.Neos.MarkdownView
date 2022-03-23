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
You can use `node` and `parentNode` in the context.

### Asynchronous Content
If [ClientEval](#clienteval) returns a Promise, the resolved value will be loaded as content.
