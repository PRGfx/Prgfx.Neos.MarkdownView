import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { neos } from '@neos-project/neos-ui-decorators';
import { selectors } from '@neos-project/neos-ui-redux-store';

const evaluate = (context, _expression) => {
    const { node, parentNode, documentNode } = context; // jshint ignore:line
    return eval(_expression.replace('ClientEval:', '')); // jshint ignore:line
}

@neos((globalRegistry) => ({
    i18nRegistry: globalRegistry.get('i18n'),
}))
@connect(state => {
    const focusedNode = selectors.CR.Nodes.focusedSelector(state);
    const parentNode = selectors.CR.Nodes.nodeByContextPath(state)(focusedNode.parent);
    const documentNode = selectors.CR.Nodes.documentNodeSelector(state);

    return {
        focusedNode,
        parentNode,
        documentNode,
    };
})
export default class MarkdownView extends PureComponent {

    static propTypes = {
        options: PropTypes.shape({
            content: PropTypes.string,
            className: PropTypes.string,
            allowedElements: PropTypes.arrayOf(PropTypes.string),
            disallowedElements: PropTypes.arrayOf(PropTypes.string),
        }).isRequired,
        focusedNode: PropTypes.object,
        parentNode: PropTypes.object,
        documentNode: PropTypes.object,
        i18nRegistry: PropTypes.object.isRequired,
    }

    state = {
        content: '',
    }

    constructor(props) {
        super(props);
    }

    componentDidMount() {
        this.generateContent();
    }

    generateContent() {
        let content = this.props.options.content || '';
        if (typeof content !== 'string') {
            content = '';
        }

        if (content.startsWith('ClientEval:')) {
            const context = {
                node: this.props.focusedNode,
                parentNode: this.props.parentNode,
                documentNode: this.props.documentNode,
            };
            content = evaluate(context, content.replace('ClientEval:', ''));
        }
        try {
            content = this.props.i18nRegistry.translate(content);
        } catch (e) {
        }


        if (typeof content === 'object'
            && 'then' in content
            && typeof content.then === 'function'
        ) {
            content.then(content => {
                this.setState({ content });
            })
        } else {
            if (typeof content === 'string') {
                content = content
                    // replace trailing \\ with double spaces to allow for line breaks lost in yaml
                    .replace(/\\\\\n/g, '  \n');
            }
            this.setState({ content });
        }
    }

    render() {
        const {
            className,
            allowedElements,
            disallowedElements,
        } = this.props.options;

        return (
            <ReactMarkdown
                className={className}
                allowedElements={allowedElements}
                disallowedElements={disallowedElements}
            >
                {this.state.content}
            </ReactMarkdown>
        );
    }
};
