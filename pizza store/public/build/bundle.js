
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function get_binding_group_value(group, __value, checked) {
        const value = new Set();
        for (let i = 0; i < group.length; i += 1) {
            if (group[i].checked)
                value.add(group[i].__value);
        }
        if (!checked) {
            value.delete(__value);
        }
        return Array.from(value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/Item.svelte generated by Svelte v3.48.0 */
    const file$5 = "src/components/Item.svelte";

    // (16:6) {#if item.discountPrice}
    function create_if_block$2(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*item*/ ctx[0].price + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("$");
    			t1 = text(t1_value);
    			attr_dev(div, "class", "pizza-price-before");
    			add_location(div, file$5, 16, 8, 441);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0].price + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(16:6) {#if item.discountPrice}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div3;
    	let img;
    	let img_src_value;
    	let img_data_src_value;
    	let img_alt_value;
    	let t0;
    	let div2;
    	let h3;
    	let t1_value = /*item*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let div1;
    	let t3;
    	let div0;
    	let t4;

    	let t5_value = (/*item*/ ctx[0].discountPrice
    	? /*item*/ ctx[0].discountPrice
    	: /*item*/ ctx[0].price) + "";

    	let t5;
    	let t6;
    	let button;
    	let svg;
    	let g1;
    	let g0;
    	let path;
    	let g2;
    	let g3;
    	let g4;
    	let g5;
    	let g6;
    	let g7;
    	let g8;
    	let g9;
    	let g10;
    	let g11;
    	let g12;
    	let g13;
    	let g14;
    	let g15;
    	let g16;
    	let mounted;
    	let dispose;
    	let if_block = /*item*/ ctx[0].discountPrice && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t3 = space();
    			div0 = element("div");
    			t4 = text("$");
    			t5 = text(t5_value);
    			t6 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			path = svg_element("path");
    			g2 = svg_element("g");
    			g3 = svg_element("g");
    			g4 = svg_element("g");
    			g5 = svg_element("g");
    			g6 = svg_element("g");
    			g7 = svg_element("g");
    			g8 = svg_element("g");
    			g9 = svg_element("g");
    			g10 = svg_element("g");
    			g11 = svg_element("g");
    			g12 = svg_element("g");
    			g13 = svg_element("g");
    			g14 = svg_element("g");
    			g15 = svg_element("g");
    			g16 = svg_element("g");
    			if (!src_url_equal(img.src, img_src_value = "./images/pizza-placeholder.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "class", "lazy");
    			attr_dev(img, "data-src", img_data_src_value = "./images/" + /*item*/ ctx[0].img);
    			attr_dev(img, "alt", img_alt_value = /*item*/ ctx[0].name);
    			add_location(img, file$5, 6, 2, 159);
    			attr_dev(h3, "class", "pizza-name");
    			add_location(h3, file$5, 13, 4, 331);
    			attr_dev(div0, "class", "pizza-price");
    			add_location(div0, file$5, 18, 6, 511);
    			attr_dev(div1, "class", "pizza-prices");
    			add_location(div1, file$5, 14, 4, 375);
    			attr_dev(div2, "class", "pizza-name-and-price-wrapper");
    			add_location(div2, file$5, 12, 2, 284);
    			attr_dev(path, "style", "current-color");
    			attr_dev(path, "d", "M280.71,126.181h-97.822V28.338C182.889,12.711,170.172,0,154.529,0S126.17,12.711,126.17,28.338 v97.843H28.359C12.722,126.181,0,138.903,0,154.529c0,15.621,12.717,28.338,28.359,28.338h97.811v97.843    c0,15.632,12.711,28.348,28.359,28.348c15.643,0,28.359-12.717,28.359-28.348v-97.843h97.822    c15.632,0,28.348-12.717,28.348-28.338C309.059,138.903,296.342,126.181,280.71,126.181z");
    			add_location(path, file$5, 43, 10, 1106);
    			add_location(g0, file$5, 42, 8, 1092);
    			add_location(g1, file$5, 41, 6, 1080);
    			add_location(g2, file$5, 49, 6, 1582);
    			add_location(g3, file$5, 50, 6, 1594);
    			add_location(g4, file$5, 51, 6, 1606);
    			add_location(g5, file$5, 52, 6, 1618);
    			add_location(g6, file$5, 53, 6, 1630);
    			add_location(g7, file$5, 54, 6, 1642);
    			add_location(g8, file$5, 55, 6, 1654);
    			add_location(g9, file$5, 56, 6, 1666);
    			add_location(g10, file$5, 57, 6, 1678);
    			add_location(g11, file$5, 58, 6, 1690);
    			add_location(g12, file$5, 59, 6, 1702);
    			add_location(g13, file$5, 60, 6, 1714);
    			add_location(g14, file$5, 61, 6, 1726);
    			add_location(g15, file$5, 62, 6, 1738);
    			add_location(g16, file$5, 63, 6, 1750);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "xmlns:xlink", "http://www.w3.org/1999/xlink");
    			attr_dev(svg, "version", "1.1");
    			attr_dev(svg, "x", "0px");
    			attr_dev(svg, "y", "0px");
    			attr_dev(svg, "width", "15px");
    			attr_dev(svg, "height", "15px");
    			attr_dev(svg, "viewBox", "0 0 309.059 309.059");
    			set_style(svg, "enable-background", "new 0 0 309.059 309.059");
    			attr_dev(svg, "xml:space", "preserve");
    			add_location(svg, file$5, 29, 4, 766);
    			attr_dev(button, "type", "button");
    			attr_dev(button, "class", "add-to-cart-button");
    			attr_dev(button, "title", "Add to cart");
    			add_location(button, file$5, 23, 2, 636);
    			attr_dev(div3, "class", "pizza-item");
    			add_location(div3, file$5, 5, 0, 132);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, img);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, h3);
    			append_dev(h3, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, t4);
    			append_dev(div0, t5);
    			append_dev(div3, t6);
    			append_dev(div3, button);
    			append_dev(button, svg);
    			append_dev(svg, g1);
    			append_dev(g1, g0);
    			append_dev(g0, path);
    			append_dev(svg, g2);
    			append_dev(svg, g3);
    			append_dev(svg, g4);
    			append_dev(svg, g5);
    			append_dev(svg, g6);
    			append_dev(svg, g7);
    			append_dev(svg, g8);
    			append_dev(svg, g9);
    			append_dev(svg, g10);
    			append_dev(svg, g11);
    			append_dev(svg, g12);
    			append_dev(svg, g13);
    			append_dev(svg, g14);
    			append_dev(svg, g15);
    			append_dev(svg, g16);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && img_data_src_value !== (img_data_src_value = "./images/" + /*item*/ ctx[0].img)) {
    				attr_dev(img, "data-src", img_data_src_value);
    			}

    			if (dirty & /*item*/ 1 && img_alt_value !== (img_alt_value = /*item*/ ctx[0].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0].name + "")) set_data_dev(t1, t1_value);

    			if (/*item*/ ctx[0].discountPrice) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div1, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*item*/ 1 && t5_value !== (t5_value = (/*item*/ ctx[0].discountPrice
    			? /*item*/ ctx[0].discountPrice
    			: /*item*/ ctx[0].price) + "")) set_data_dev(t5, t5_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Item', slots, []);
    	const emit = createEventDispatcher();
    	let { item } = $$props;
    	const writable_props = ['item'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Item> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => emit("add-to-cart");

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({ createEventDispatcher, emit, item });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item, emit, click_handler];
    }

    class Item extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Item",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !('item' in props)) {
    			console.warn("<Item> was created without expected prop 'item'");
    		}
    	}

    	get item() {
    		throw new Error("<Item>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Item>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var topings = [
        {
            id: 1,
            label: "Avocado",
            price: 1,
        },
        {
            id: 2,
            label: "Lobster",
            price: 2,
        },
        {
            id: 3,
            label: "Bacon",
            price: 3,
        },
        {
            id: 4,
            label: "Broccoli",
            price: 1,
        },
        {
            id: 5,
            label: "Oyster",
            price: 2,
        },
        {
            id: 6,
            label: "Duck",
            price: 3,
        },
        {
            id: 7,
            label: "Onions",
            price: 1,
        },
        {
            id: 8,
            label: "Salmon",
            price: 2,
        },
        {
            id: 9,
            label: "Ham",
            price: 3,
        },
        {
            id: 10,
            label: "Zucchini",
            price: 1,
        },
        {
            id: 11,
            label: "Tuna",
            price: 2,
        },
        {
            id: 12,
            label: "Sausage",
            price: 3,
        },
    ];

    /* src/components/AmountButton.svelte generated by Svelte v3.48.0 */

    const file$4 = "src/components/AmountButton.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let button0;
    	let t0;
    	let button0_disabled_value;
    	let t1;
    	let div0;
    	let t2;
    	let t3;
    	let button1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			button0 = element("button");
    			t0 = text("-");
    			t1 = space();
    			div0 = element("div");
    			t2 = text(/*amount*/ ctx[0]);
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "+";
    			button0.disabled = button0_disabled_value = /*amount*/ ctx[0] <= 1;
    			attr_dev(button0, "class", "svelte-omdb06");
    			add_location(button0, file$4, 4, 2, 87);
    			attr_dev(div0, "class", "amount svelte-omdb06");
    			add_location(div0, file$4, 7, 2, 179);
    			attr_dev(button1, "class", "svelte-omdb06");
    			add_location(button1, file$4, 8, 2, 216);
    			attr_dev(div1, "class", "amount-button mt-1 svelte-omdb06");
    			add_location(div1, file$4, 3, 0, 52);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, button0);
    			append_dev(button0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, button1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*amount*/ 1 && button0_disabled_value !== (button0_disabled_value = /*amount*/ ctx[0] <= 1)) {
    				prop_dev(button0, "disabled", button0_disabled_value);
    			}

    			if (dirty & /*amount*/ 1) set_data_dev(t2, /*amount*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AmountButton', slots, []);
    	let { amount = 1 } = $$props;
    	const writable_props = ['amount'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AmountButton> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => amount > 1 && $$invalidate(0, amount--, amount);
    	const click_handler_1 = () => $$invalidate(0, amount++, amount);

    	$$self.$$set = $$props => {
    		if ('amount' in $$props) $$invalidate(0, amount = $$props.amount);
    	};

    	$$self.$capture_state = () => ({ amount });

    	$$self.$inject_state = $$props => {
    		if ('amount' in $$props) $$invalidate(0, amount = $$props.amount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [amount, click_handler, click_handler_1];
    }

    class AmountButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { amount: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AmountButton",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get amount() {
    		throw new Error("<AmountButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set amount(value) {
    		throw new Error("<AmountButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/PizzaDialog.svelte generated by Svelte v3.48.0 */

    const { Object: Object_1$1 } = globals;
    const file$3 = "src/components/PizzaDialog.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (68:8) {#if pizza.discountPrice}
    function create_if_block$1(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*pizzaPriceBefore*/ ctx[6].toFixed(1) + "";
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("$");
    			t1 = text(t1_value);
    			attr_dev(span, "class", "pizza-price-before");
    			add_location(span, file$3, 68, 10, 1793);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pizzaPriceBefore*/ 64 && t1_value !== (t1_value = /*pizzaPriceBefore*/ ctx[6].toFixed(1) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(68:8) {#if pizza.discountPrice}",
    		ctx
    	});

    	return block;
    }

    // (80:8) {#each topings as toping, index}
    function create_each_block$2(ctx) {
    	let div;
    	let label;
    	let input;
    	let t0;
    	let span;
    	let t1_value = /*toping*/ ctx[18].label + "";
    	let t1;
    	let t2;
    	let t3_value = /*toping*/ ctx[18].price + "";
    	let t3;
    	let t4;
    	let t5;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = text(" ($");
    			t3 = text(t3_value);
    			t4 = text(")");
    			t5 = space();
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "name", "topings");
    			input.__value = /*toping*/ ctx[18].id;
    			input.value = input.__value;
    			/*$$binding_groups*/ ctx[14][0].push(input);
    			add_location(input, file$3, 82, 14, 2195);
    			attr_dev(span, "class", "toping-list-item-name");
    			add_location(span, file$3, 88, 14, 2377);
    			add_location(label, file$3, 81, 12, 2173);
    			attr_dev(div, "class", "toping-list-item");
    			add_location(div, file$3, 80, 10, 2130);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, label);
    			append_dev(label, input);
    			input.checked = ~/*selectedTopingsId*/ ctx[0].indexOf(input.__value);
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(span, t1);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(span, t4);
    			append_dev(div, t5);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[13]);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*selectedTopingsId*/ 1) {
    				input.checked = ~/*selectedTopingsId*/ ctx[0].indexOf(input.__value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*$$binding_groups*/ ctx[14][0].splice(/*$$binding_groups*/ ctx[14][0].indexOf(input), 1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(80:8) {#each topings as toping, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let dialog_1;
    	let div5;
    	let h2;
    	let t0_value = /*pizza*/ ctx[2].name + "";
    	let t0;
    	let t1;
    	let div3;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let img_title_value;
    	let t2;
    	let div1;
    	let t3;
    	let div0;
    	let t4;
    	let t5_value = /*pizzaRealPrice*/ ctx[5].toFixed(1) + "";
    	let t5;
    	let t6;
    	let h30;
    	let t8;
    	let div2;
    	let t9;
    	let h31;
    	let t11;
    	let amountbutton;
    	let updating_amount;
    	let t12;
    	let div4;
    	let button0;
    	let t14;
    	let button1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*pizza*/ ctx[2].discountPrice && create_if_block$1(ctx);
    	let each_value = topings;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	function amountbutton_amount_binding(value) {
    		/*amountbutton_amount_binding*/ ctx[15](value);
    	}

    	let amountbutton_props = {};

    	if (/*amount*/ ctx[3] !== void 0) {
    		amountbutton_props.amount = /*amount*/ ctx[3];
    	}

    	amountbutton = new AmountButton({
    			props: amountbutton_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(amountbutton, 'amount', amountbutton_amount_binding));

    	const block = {
    		c: function create() {
    			dialog_1 = element("dialog");
    			div5 = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			div3 = element("div");
    			img = element("img");
    			t2 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t3 = space();
    			div0 = element("div");
    			t4 = text("$");
    			t5 = text(t5_value);
    			t6 = space();
    			h30 = element("h3");
    			h30.textContent = "Select topings";
    			t8 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t9 = space();
    			h31 = element("h3");
    			h31.textContent = "Amount";
    			t11 = space();
    			create_component(amountbutton.$$.fragment);
    			t12 = space();
    			div4 = element("div");
    			button0 = element("button");
    			button0.textContent = "Cancel";
    			t14 = space();
    			button1 = element("button");
    			button1.textContent = "Add to cart";
    			add_location(h2, file$3, 56, 4, 1529);
    			attr_dev(img, "class", "pizza-img");
    			if (!src_url_equal(img.src, img_src_value = "./images/" + /*pizza*/ ctx[2].img)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*pizza*/ ctx[2].name);
    			attr_dev(img, "title", img_title_value = /*pizza*/ ctx[2].name);
    			add_location(img, file$3, 59, 6, 1588);
    			attr_dev(div0, "class", "pizza-price");
    			add_location(div0, file$3, 72, 8, 1910);
    			attr_dev(div1, "class", "pizza-prices");
    			add_location(div1, file$3, 66, 6, 1722);
    			attr_dev(h30, "class", "mt-1");
    			add_location(h30, file$3, 77, 6, 2010);
    			attr_dev(div2, "class", "toping-list");
    			add_location(div2, file$3, 78, 6, 2053);
    			attr_dev(h31, "class", "mt-1");
    			add_location(h31, file$3, 96, 6, 2559);
    			attr_dev(div3, "class", "dialog-body");
    			add_location(div3, file$3, 58, 4, 1556);
    			add_location(button0, file$3, 102, 6, 2674);
    			attr_dev(button1, "class", "add-to-cart-button-on-modal");
    			add_location(button1, file$3, 103, 6, 2721);
    			attr_dev(div4, "class", "modal-actions");
    			add_location(div4, file$3, 101, 4, 2640);
    			attr_dev(div5, "class", "dialog");
    			add_location(div5, file$3, 55, 2, 1504);
    			attr_dev(dialog_1, "class", "dialog-wrapper");
    			add_location(dialog_1, file$3, 48, 0, 1382);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, dialog_1, anchor);
    			append_dev(dialog_1, div5);
    			append_dev(div5, h2);
    			append_dev(h2, t0);
    			append_dev(div5, t1);
    			append_dev(div5, div3);
    			append_dev(div3, img);
    			append_dev(div3, t2);
    			append_dev(div3, div1);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t3);
    			append_dev(div1, div0);
    			append_dev(div0, t4);
    			append_dev(div0, t5);
    			append_dev(div3, t6);
    			append_dev(div3, h30);
    			append_dev(div3, t8);
    			append_dev(div3, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(div3, t9);
    			append_dev(div3, h31);
    			append_dev(div3, t11);
    			mount_component(amountbutton, div3, null);
    			append_dev(div5, t12);
    			append_dev(div5, div4);
    			append_dev(div4, button0);
    			append_dev(div4, t14);
    			append_dev(div4, button1);
    			/*dialog_1_binding*/ ctx[16](dialog_1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*close*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*addToCart*/ ctx[7], false, false, false),
    					listen_dev(dialog_1, "close", /*onClose*/ ctx[8], false, false, false),
    					listen_dev(dialog_1, "cancel", /*onClose*/ ctx[8], false, false, false),
    					listen_dev(dialog_1, "click", /*onClick*/ ctx[9], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*pizza*/ 4) && t0_value !== (t0_value = /*pizza*/ ctx[2].name + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*pizza*/ 4 && !src_url_equal(img.src, img_src_value = "./images/" + /*pizza*/ ctx[2].img)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (!current || dirty & /*pizza*/ 4 && img_alt_value !== (img_alt_value = /*pizza*/ ctx[2].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (!current || dirty & /*pizza*/ 4 && img_title_value !== (img_title_value = /*pizza*/ ctx[2].name)) {
    				attr_dev(img, "title", img_title_value);
    			}

    			if (/*pizza*/ ctx[2].discountPrice) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div1, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*pizzaRealPrice*/ 32) && t5_value !== (t5_value = /*pizzaRealPrice*/ ctx[5].toFixed(1) + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*topings, selectedTopingsId*/ 1) {
    				each_value = topings;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			const amountbutton_changes = {};

    			if (!updating_amount && dirty & /*amount*/ 8) {
    				updating_amount = true;
    				amountbutton_changes.amount = /*amount*/ ctx[3];
    				add_flush_callback(() => updating_amount = false);
    			}

    			amountbutton.$set(amountbutton_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(amountbutton.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(amountbutton.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(dialog_1);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			destroy_component(amountbutton);
    			/*dialog_1_binding*/ ctx[16](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let selectedTopings;
    	let totalSelectedTopings;
    	let pizzaPriceBefore;
    	let pizzaRealPrice;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('PizzaDialog', slots, []);
    	const emit = createEventDispatcher();
    	let dialog;

    	let pizza = {
    		name: "",
    		discountPrice: 0,
    		price: 0,
    		img: ""
    	};

    	let amount = 1;
    	let { selectedTopingsId = [] } = $$props;

    	function open(_pizza) {
    		$$invalidate(2, pizza = Object.assign({}, _pizza));

    		// @ts-ignore
    		dialog.showModal();

    		dialog.querySelector(".dialog-body").scrollTop = 0;
    		document.body.classList.add("disable-scroll-y");
    	}

    	function close() {
    		// @ts-ignore
    		dialog.close();
    	}

    	function addToCart() {
    		emit("add-to-chart", { topings: selectedTopings, amount });
    		onClose();
    	}

    	function onClose() {
    		$$invalidate(0, selectedTopingsId = []);
    		$$invalidate(3, amount = 1);
    		document.body.classList.remove("disable-scroll-y");
    	}

    	function onClick(event) {
    		// @ts-ignore
    		if (event.target.isSameNode(dialog)) {
    			close();
    		}
    	}

    	const writable_props = ['selectedTopingsId'];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<PizzaDialog> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function input_change_handler() {
    		selectedTopingsId = get_binding_group_value($$binding_groups[0], this.__value, this.checked);
    		$$invalidate(0, selectedTopingsId);
    	}

    	function amountbutton_amount_binding(value) {
    		amount = value;
    		$$invalidate(3, amount);
    	}

    	function dialog_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			dialog = $$value;
    			$$invalidate(4, dialog);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('selectedTopingsId' in $$props) $$invalidate(0, selectedTopingsId = $$props.selectedTopingsId);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		topings,
    		AmountButton,
    		emit,
    		dialog,
    		pizza,
    		amount,
    		selectedTopingsId,
    		open,
    		close,
    		addToCart,
    		onClose,
    		onClick,
    		totalSelectedTopings,
    		pizzaRealPrice,
    		pizzaPriceBefore,
    		selectedTopings
    	});

    	$$self.$inject_state = $$props => {
    		if ('dialog' in $$props) $$invalidate(4, dialog = $$props.dialog);
    		if ('pizza' in $$props) $$invalidate(2, pizza = $$props.pizza);
    		if ('amount' in $$props) $$invalidate(3, amount = $$props.amount);
    		if ('selectedTopingsId' in $$props) $$invalidate(0, selectedTopingsId = $$props.selectedTopingsId);
    		if ('totalSelectedTopings' in $$props) $$invalidate(11, totalSelectedTopings = $$props.totalSelectedTopings);
    		if ('pizzaRealPrice' in $$props) $$invalidate(5, pizzaRealPrice = $$props.pizzaRealPrice);
    		if ('pizzaPriceBefore' in $$props) $$invalidate(6, pizzaPriceBefore = $$props.pizzaPriceBefore);
    		if ('selectedTopings' in $$props) $$invalidate(12, selectedTopings = $$props.selectedTopings);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*selectedTopingsId*/ 1) {
    			$$invalidate(12, selectedTopings = selectedTopingsId.map(id => topings.find(toping => toping.id === id)));
    		}

    		if ($$self.$$.dirty & /*selectedTopings*/ 4096) {
    			$$invalidate(11, totalSelectedTopings = selectedTopings.reduce((prevPrice, topingB) => prevPrice + topingB.price, 0));
    		}

    		if ($$self.$$.dirty & /*pizza, totalSelectedTopings, amount*/ 2060) {
    			$$invalidate(6, pizzaPriceBefore = (pizza.price + totalSelectedTopings) * amount);
    		}

    		if ($$self.$$.dirty & /*pizza, totalSelectedTopings, amount*/ 2060) {
    			$$invalidate(5, pizzaRealPrice = ((pizza.discountPrice ? pizza.discountPrice : pizza.price) + totalSelectedTopings) * amount);
    		}
    	};

    	return [
    		selectedTopingsId,
    		close,
    		pizza,
    		amount,
    		dialog,
    		pizzaRealPrice,
    		pizzaPriceBefore,
    		addToCart,
    		onClose,
    		onClick,
    		open,
    		totalSelectedTopings,
    		selectedTopings,
    		input_change_handler,
    		$$binding_groups,
    		amountbutton_amount_binding,
    		dialog_1_binding
    	];
    }

    class PizzaDialog extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { selectedTopingsId: 0, open: 10, close: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PizzaDialog",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get selectedTopingsId() {
    		throw new Error("<PizzaDialog>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedTopingsId(value) {
    		throw new Error("<PizzaDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get open() {
    		return this.$$.ctx[10];
    	}

    	set open(value) {
    		throw new Error("<PizzaDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		return this.$$.ctx[1];
    	}

    	set close(value) {
    		throw new Error("<PizzaDialog>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const lsNamespace = "carts";
    if (!localStorage.getItem(lsNamespace)) {
        localStorage.setItem(lsNamespace, JSON.stringify([]));
    }
    const carts = writable(JSON.parse(localStorage.getItem(lsNamespace)));
    carts.subscribe((theCarts) => localStorage.setItem(lsNamespace, JSON.stringify(theCarts)));
    function removeFromCart(index) {
        carts.update((oldcart) => {
            oldcart.splice(index, 1);
            return oldcart;
        });
    }

    const pizzas = [
        {
            name: "American Classix Cheeseburger",
            discountPrice: 8,
            price: 10,
            img: "american-classic-cheeseburger-550x550px.png",
        },
        {
            name: "Grilled Beef Supreme",
            discountPrice: 10,
            price: 12,
            img: "grill-beef-supreme-550x550px.png",
        },
        {
            name: "Cheesy Meatball Blast",
            discountPrice: 13,
            price: 15,
            img: "meatballpizzathumbnail.png",
        },
        {
            name: "Arabic Beef Kebab",
            discountPrice: 2.8,
            price: 3,
            img: "beef_kebab_side.png",
        },
        {
            name: "Ultimate Cheese Melt",
            discountPrice: 5.7,
            price: 6,
            img: "ultimatecheesemeltnew.png",
        },
        {
            name: "Chicken Dominator",
            discountPrice: 4.5,
            price: 5,
            img: "chicken-dominator-550x550px.png",
        },
        {
            name: "American All Star",
            discountPrice: 0,
            price: 2,
            img: "american-allstar-550x550px.png",
        },
    ];

    /* src/components/CartItem.svelte generated by Svelte v3.48.0 */
    const file$2 = "src/components/CartItem.svelte";

    // (31:6) {#if item.amount > 1}
    function create_if_block(ctx) {
    	let t0;
    	let t1_value = /*item*/ ctx[0].amount + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("(x");
    			t1 = text(t1_value);
    			t2 = text(")");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0].amount + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(31:6) {#if item.amount > 1}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div4;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let button;
    	let svg;
    	let path;
    	let t1;
    	let div3;
    	let h3;
    	let t2_value = /*item*/ ctx[0].name + "";
    	let t2;
    	let t3;
    	let t4;
    	let div0;
    	let t5_value = /*item*/ ctx[0].topings.map(func).join(", ") + "";
    	let t5;
    	let t6;
    	let div2;
    	let div1;
    	let t7;
    	let t8_value = (/*totalTopingPrice*/ ctx[3] + /*pizzaPrice*/ ctx[2]) * /*item*/ ctx[0].amount + "";
    	let t8;
    	let mounted;
    	let dispose;
    	let if_block = /*item*/ ctx[0].amount > 1 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			img = element("img");
    			t0 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t1 = space();
    			div3 = element("div");
    			h3 = element("h3");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = space();
    			div0 = element("div");
    			t5 = text(t5_value);
    			t6 = space();
    			div2 = element("div");
    			div1 = element("div");
    			t7 = text("$");
    			t8 = text(t8_value);
    			if (!src_url_equal(img.src, img_src_value = "./images/" + /*item*/ ctx[0].img)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*item*/ ctx[0].name);
    			add_location(img, file$2, 10, 2, 343);
    			attr_dev(path, "d", "M 10.806641 2 C 10.289641 2 9.7956875 2.2043125 9.4296875 2.5703125 L 9 3 L 4 3 A 1.0001 1.0001 0 1 0 4 5 L 20 5 A 1.0001 1.0001 0 1 0 20 3 L 15 3 L 14.570312 2.5703125 C 14.205312 2.2043125 13.710359 2 13.193359 2 L 10.806641 2 z M 4.3652344 7 L 5.8925781 20.263672 C 6.0245781 21.253672 6.877 22 7.875 22 L 16.123047 22 C 17.121047 22 17.974422 21.254859 18.107422 20.255859 L 19.634766 7 L 4.3652344 7 z");
    			add_location(path, file$2, 22, 7, 668);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "#fff");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "width", "15.5px");
    			attr_dev(svg, "height", "15.5px");
    			add_location(svg, file$2, 16, 4, 528);
    			attr_dev(button, "class", "btn-delete-pizza-cart-item");
    			attr_dev(button, "title", "Delete pizza from cart");
    			add_location(button, file$2, 11, 2, 395);
    			attr_dev(h3, "class", "pizza-name");
    			add_location(h3, file$2, 28, 4, 1174);
    			attr_dev(div0, "class", "pizza-topings");
    			add_location(div0, file$2, 34, 4, 1295);
    			attr_dev(div1, "class", "pizza-price");
    			add_location(div1, file$2, 38, 6, 1433);
    			attr_dev(div2, "class", "pizza-prices");
    			add_location(div2, file$2, 37, 4, 1400);
    			attr_dev(div3, "class", "pizza-name-and-price-wrapper");
    			add_location(div3, file$2, 27, 2, 1127);
    			attr_dev(div4, "class", "pizza-cart-item");
    			add_location(div4, file$2, 9, 0, 311);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, img);
    			append_dev(div4, t0);
    			append_dev(div4, button);
    			append_dev(button, svg);
    			append_dev(svg, path);
    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div3, h3);
    			append_dev(h3, t2);
    			append_dev(h3, t3);
    			if (if_block) if_block.m(h3, null);
    			append_dev(div3, t4);
    			append_dev(div3, div0);
    			append_dev(div0, t5);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, t7);
    			append_dev(div1, t8);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && !src_url_equal(img.src, img_src_value = "./images/" + /*item*/ ctx[0].img)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*item*/ 1 && img_alt_value !== (img_alt_value = /*item*/ ctx[0].name)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = /*item*/ ctx[0].name + "")) set_data_dev(t2, t2_value);

    			if (/*item*/ ctx[0].amount > 1) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(h3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*item*/ 1 && t5_value !== (t5_value = /*item*/ ctx[0].topings.map(func).join(", ") + "")) set_data_dev(t5, t5_value);
    			if (dirty & /*totalTopingPrice, pizzaPrice, item*/ 13 && t8_value !== (t8_value = (/*totalTopingPrice*/ ctx[3] + /*pizzaPrice*/ ctx[2]) * /*item*/ ctx[0].amount + "")) set_data_dev(t8, t8_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = toping => toping.label;

    function instance$2($$self, $$props, $$invalidate) {
    	let totalTopingPrice;
    	let pizzaPrice;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CartItem', slots, []);
    	let { item } = $$props;
    	let { index } = $$props;
    	const writable_props = ['item', 'index'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<CartItem> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => removeFromCart(index);

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('index' in $$props) $$invalidate(1, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({
    		removeFromCart,
    		item,
    		index,
    		pizzaPrice,
    		totalTopingPrice
    	});

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    		if ('index' in $$props) $$invalidate(1, index = $$props.index);
    		if ('pizzaPrice' in $$props) $$invalidate(2, pizzaPrice = $$props.pizzaPrice);
    		if ('totalTopingPrice' in $$props) $$invalidate(3, totalTopingPrice = $$props.totalTopingPrice);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*item*/ 1) {
    			$$invalidate(3, totalTopingPrice = item.topings.map(toping => toping.price).reduce((topingA, topingB) => topingA + topingB, 0));
    		}

    		if ($$self.$$.dirty & /*item*/ 1) {
    			$$invalidate(2, pizzaPrice = item.discountPrice ? item.discountPrice : item.price);
    		}
    	};

    	return [item, index, pizzaPrice, totalTopingPrice, click_handler];
    }

    class CartItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { item: 0, index: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CartItem",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*item*/ ctx[0] === undefined && !('item' in props)) {
    			console.warn("<CartItem> was created without expected prop 'item'");
    		}

    		if (/*index*/ ctx[1] === undefined && !('index' in props)) {
    			console.warn("<CartItem> was created without expected prop 'index'");
    		}
    	}

    	get item() {
    		throw new Error("<CartItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<CartItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get index() {
    		throw new Error("<CartItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<CartItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Carts.svelte generated by Svelte v3.48.0 */
    const file$1 = "src/components/Carts.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (17:4) {#each $carts as cart, index}
    function create_each_block$1(ctx) {
    	let cartitem;
    	let current;

    	cartitem = new CartItem({
    			props: {
    				index: /*index*/ ctx[5],
    				item: /*cart*/ ctx[3]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(cartitem.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cartitem, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const cartitem_changes = {};
    			if (dirty & /*$carts*/ 1) cartitem_changes.item = /*cart*/ ctx[3];
    			cartitem.$set(cartitem_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cartitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cartitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cartitem, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(17:4) {#each $carts as cart, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div2;
    	let h2;
    	let t0;
    	let t1_value = /*$carts*/ ctx[0].length + "";
    	let t1;
    	let t2;
    	let t3;
    	let div0;
    	let t4;
    	let div1;
    	let t5;
    	let span;
    	let t6;
    	let t7_value = /*pizzaCartTotal*/ ctx[2] + /*topingsCartTotal*/ ctx[1] + "";
    	let t7;
    	let current;
    	let each_value = /*$carts*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h2 = element("h2");
    			t0 = text("Cart (");
    			t1 = text(t1_value);
    			t2 = text(")");
    			t3 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			div1 = element("div");
    			t5 = text("Total ");
    			span = element("span");
    			t6 = text("$");
    			t7 = text(t7_value);
    			add_location(h2, file$1, 14, 2, 524);
    			attr_dev(div0, "class", "pizza-list");
    			add_location(div0, file$1, 15, 2, 558);
    			attr_dev(span, "class", "price");
    			add_location(span, file$1, 21, 10, 714);
    			attr_dev(div1, "class", "cart-total");
    			add_location(div1, file$1, 20, 2, 679);
    			attr_dev(div2, "class", "cart-wrapper");
    			add_location(div2, file$1, 13, 0, 495);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(h2, t2);
    			append_dev(div2, t3);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, t5);
    			append_dev(div1, span);
    			append_dev(span, t6);
    			append_dev(span, t7);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*$carts*/ 1) && t1_value !== (t1_value = /*$carts*/ ctx[0].length + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*$carts*/ 1) {
    				each_value = /*$carts*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if ((!current || dirty & /*pizzaCartTotal, topingsCartTotal*/ 6) && t7_value !== (t7_value = /*pizzaCartTotal*/ ctx[2] + /*topingsCartTotal*/ ctx[1] + "")) set_data_dev(t7, t7_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let pizzaCartTotal;
    	let topingsCartTotal;
    	let $carts;
    	validate_store(carts, 'carts');
    	component_subscribe($$self, carts, $$value => $$invalidate(0, $carts = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Carts', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Carts> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		CartItem,
    		carts,
    		topingsCartTotal,
    		pizzaCartTotal,
    		$carts
    	});

    	$$self.$inject_state = $$props => {
    		if ('topingsCartTotal' in $$props) $$invalidate(1, topingsCartTotal = $$props.topingsCartTotal);
    		if ('pizzaCartTotal' in $$props) $$invalidate(2, pizzaCartTotal = $$props.pizzaCartTotal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$carts*/ 1) {
    			$$invalidate(2, pizzaCartTotal = $carts.map(pizza => !!pizza.discountPrice
    			? pizza.discountPrice * pizza.amount
    			: pizza.price * pizza.amount).reduce((pizzaA, pizzaB) => pizzaA + pizzaB, 0));
    		}

    		if ($$self.$$.dirty & /*$carts*/ 1) {
    			$$invalidate(1, topingsCartTotal = $carts.map(pizza => pizza.topings.map(toping => toping.price * pizza.amount)).flat().reduce((pizzaA, pizzaB) => pizzaA + pizzaB, 0));
    		}
    	};

    	return [$carts, topingsCartTotal, pizzaCartTotal];
    }

    class Carts extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Carts",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.48.0 */

    const { Object: Object_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (28:6) {#each pizzas as pizza}
    function create_each_block(ctx) {
    	let item;
    	let current;

    	function add_to_cart_handler() {
    		return /*add_to_cart_handler*/ ctx[3](/*pizza*/ ctx[6]);
    	}

    	item = new Item({
    			props: { item: /*pizza*/ ctx[6] },
    			$$inline: true
    		});

    	item.$on("add-to-cart", add_to_cart_handler);

    	const block = {
    		c: function create() {
    			create_component(item.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(item, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(item.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(item.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(item, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(28:6) {#each pizzas as pizza}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let heading;
    	let h1;
    	let t1;
    	let div2;
    	let div1;
    	let h2;
    	let t3;
    	let div0;
    	let t4;
    	let carts_1;
    	let t5;
    	let pizzadialog;
    	let t6;
    	let footer;
    	let t7;
    	let a;
    	let current;
    	let each_value = pizzas;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	carts_1 = new Carts({ $$inline: true });
    	let pizzadialog_props = {};
    	pizzadialog = new PizzaDialog({ props: pizzadialog_props, $$inline: true });
    	/*pizzadialog_binding*/ ctx[4](pizzadialog);
    	pizzadialog.$on("add-to-chart", /*addToCart*/ ctx[2]);

    	const block = {
    		c: function create() {
    			heading = element("heading");
    			h1 = element("h1");
    			h1.textContent = "Pizza Store";
    			t1 = space();
    			div2 = element("div");
    			div1 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Pizza List";
    			t3 = space();
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			create_component(carts_1.$$.fragment);
    			t5 = space();
    			create_component(pizzadialog.$$.fragment);
    			t6 = space();
    			footer = element("footer");
    			t7 = text("Developed with ❤️ by ");
    			a = element("a");
    			a.textContent = "Don Alfons Nisnoni";
    			add_location(h1, file, 20, 2, 708);
    			attr_dev(heading, "class", "main-heading");
    			add_location(heading, file, 19, 0, 675);
    			add_location(h2, file, 25, 4, 811);
    			attr_dev(div0, "class", "pizza-list");
    			add_location(div0, file, 26, 4, 835);
    			attr_dev(div1, "class", "pizza-list-wrapper");
    			add_location(div1, file, 24, 2, 774);
    			attr_dev(div2, "class", "pizza-store-main");
    			add_location(div2, file, 23, 0, 741);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "href", "https://github.com/donnisnoni");
    			add_location(a, file, 39, 23, 1139);
    			attr_dev(footer, "class", "footer");
    			add_location(footer, file, 38, 0, 1092);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, heading, anchor);
    			append_dev(heading, h1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, h2);
    			append_dev(div1, t3);
    			append_dev(div1, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div2, t4);
    			mount_component(carts_1, div2, null);
    			append_dev(div2, t5);
    			mount_component(pizzadialog, div2, null);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, t7);
    			append_dev(footer, a);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pizzas, openPizzaDialog*/ 2) {
    				each_value = pizzas;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const pizzadialog_changes = {};
    			pizzadialog.$set(pizzadialog_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(carts_1.$$.fragment, local);
    			transition_in(pizzadialog.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(carts_1.$$.fragment, local);
    			transition_out(pizzadialog.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(heading);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			destroy_component(carts_1);
    			/*pizzadialog_binding*/ ctx[4](null);
    			destroy_component(pizzadialog);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(footer);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let pizzaDialog;
    	let currentSelectedPizza = null;

    	function openPizzaDialog(pizza) {
    		currentSelectedPizza = Object.assign({}, pizza);
    		pizzaDialog.open(currentSelectedPizza);
    	}

    	function addToCart({ detail }) {
    		currentSelectedPizza.topings = detail.topings;
    		currentSelectedPizza.amount = detail.amount;
    		carts.update(prevCarts => [...prevCarts, currentSelectedPizza]);
    		pizzaDialog.close();
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const add_to_cart_handler = pizza => openPizzaDialog(pizza);

    	function pizzadialog_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			pizzaDialog = $$value;
    			$$invalidate(0, pizzaDialog);
    		});
    	}

    	$$self.$capture_state = () => ({
    		Item,
    		PizzaDialog,
    		carts,
    		pizzas,
    		Carts,
    		pizzaDialog,
    		currentSelectedPizza,
    		openPizzaDialog,
    		addToCart
    	});

    	$$self.$inject_state = $$props => {
    		if ('pizzaDialog' in $$props) $$invalidate(0, pizzaDialog = $$props.pizzaDialog);
    		if ('currentSelectedPizza' in $$props) currentSelectedPizza = $$props.currentSelectedPizza;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		pizzaDialog,
    		openPizzaDialog,
    		addToCart,
    		add_to_cart_handler,
    		pizzadialog_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.getElementById("app"),
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
