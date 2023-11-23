const _getGuestFrame = () => new Promise(resolve => {
    const iframe = document.querySelector('iframe');
    if (iframe) {
        resolve(iframe);
    }
});

/**
 * Given a CSS selector, tries to find the respective element in the guest-frame
 * @private
 */
const _htmlElement = (selector) =>
    () => document.querySelector('iframe').contentDocument.querySelector(selector);

/**
 * Given a node object, tries to find the HTML element in the guest-frame belonging to that node
 * @private
 */
const _nodeHtml = (node) =>
    () => document.querySelector('iframe').contentDocument.querySelector(`[data-__neos-node-contextpath="${node.contextPath}"]`);

/**
 * @template T
 * @type {{
 *     (test: () => T, retries?: number, timeout?: number): Promise<T>;
 *     (test: number): Promise<void>;
 *     (test: Promise<T>): Promise<T>;
 *     (test: unknown[]): Promise<unknown>;
 * }}
 */
const _waitFor = (test, retries = 10, timeout = 200) => new Promise((res, rej) => {
    if (typeof test === 'number') {
        setTimeout(res, test);
        return;
    }
    if (typeof test === 'object' && test instanceof Promise) {
        test.then(res);
        return;
    }
    if (Array.isArray(test)) {
        Promise.allSettled(test.map(_waitFor(test, retries, timeout))).then(res);
        return;
    }

    const retry = (cb) => {
        const result = cb();
        if (result) {
            res(result);
        } else if (retries-- > 0) {
            setTimeout(() => retry(cb), timeout);
        } else {
            rej();
        }
    }
    retry(test);
});

export const evaluate = (context, _expression) => {
    const {node, parentNode, documentNode} = context; // jshint ignore:line
    const guestFrame = _getGuestFrame();
    const htmlElement = _htmlElement;
    const waitFor = _waitFor;
    const nodeHtml = _nodeHtml(node);
    return eval(_expression.replace('ClientEval:', '')); // jshint ignore:line
}

export const getGuestFrame = _getGuestFrame;
