import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import ReactMarkdown from 'react-markdown';
import { neos } from '@neos-project/neos-ui-decorators';
import { Icon } from '@neos-project/react-ui-components';
import { selectors } from '@neos-project/neos-ui-redux-store';
import { evaluate, getGuestFrame } from './helper';

const Loader = () => (
    <div style={{ textAlign: 'center', marginBlock: '4px' }}>
        <Icon
            icon="spinner"
            spin
        />
    </div>
);

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
        loading: false,
    }

    constructor(props) {
        super(props);

        const regenerateContent = this.generateContent.bind(this);
        getGuestFrame().then(iframe => {
            iframe.addEventListener('load', regenerateContent);
        })
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
            this.setState({ loading: true });
            content
                .then(content => {
                    this.setState({ content });
                })
                .catch(console.warn)
                .then(() => {
                    this.setState({ loading: false });
                });
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

        if (this.state.loading) {
            return <Loader/>
        }

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
