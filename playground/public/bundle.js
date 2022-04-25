
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
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
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
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
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
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
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/button.svelte generated by Svelte v3.9.1 */

    const file = "src/button.svelte";

    function create_fragment(ctx) {
    	var button, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	return {
    		c: function create() {
    			button = element("button");

    			if (default_slot) default_slot.c();

    			attr(button, "class", "svelte-11y9jbw");
    			add_location(button, file, 11, 0, 181);
    			dispose = listen(button, "click", ctx.click_handler);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(button_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(button);
    			}

    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { click_handler, $$slots, $$scope };
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, []);
    	}
    }

    /* src/book.svelte generated by Svelte v3.9.1 */

    const file$1 = "src/book.svelte";

    // (38:4) <Button on:click={purchaseBook}>
    function create_default_slot(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Buy");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    function create_fragment$1(ctx) {
    	var div, h1, t0, t1, h2, t2, t3, p, t4, t5, current;

    	var button = new Button({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.purchaseBook);

    	return {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(ctx.bookTitle);
    			t1 = space();
    			h2 = element("h2");
    			t2 = text(ctx.bookPages);
    			t3 = space();
    			p = element("p");
    			t4 = text(ctx.bookDescription);
    			t5 = space();
    			button.$$.fragment.c();
    			attr(h1, "class", "svelte-r2hqbl");
    			add_location(h1, file$1, 34, 4, 523);
    			attr(h2, "class", "svelte-r2hqbl");
    			add_location(h2, file$1, 35, 4, 550);
    			attr(p, "class", "svelte-r2hqbl");
    			add_location(p, file$1, 36, 4, 577);
    			attr(div, "class", "svelte-r2hqbl");
    			add_location(div, file$1, 33, 0, 513);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, h1);
    			append(h1, t0);
    			append(div, t1);
    			append(div, h2);
    			append(h2, t2);
    			append(div, t3);
    			append(div, p);
    			append(p, t4);
    			append(div, t5);
    			mount_component(button, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.bookTitle) {
    				set_data(t0, ctx.bookTitle);
    			}

    			if (!current || changed.bookPages) {
    				set_data(t2, ctx.bookPages);
    			}

    			if (!current || changed.bookDescription) {
    				set_data(t4, ctx.bookDescription);
    			}

    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(button);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	

    let { bookTitle, bookPages, bookDescription } = $$props;

    const dispatch =  createEventDispatcher();
    function purchaseBook(){
        dispatch('buy', bookTitle);
    }

    	const writable_props = ['bookTitle', 'bookPages', 'bookDescription'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Book> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('bookTitle' in $$props) $$invalidate('bookTitle', bookTitle = $$props.bookTitle);
    		if ('bookPages' in $$props) $$invalidate('bookPages', bookPages = $$props.bookPages);
    		if ('bookDescription' in $$props) $$invalidate('bookDescription', bookDescription = $$props.bookDescription);
    	};

    	return {
    		bookTitle,
    		bookPages,
    		bookDescription,
    		purchaseBook
    	};
    }

    class Book extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["bookTitle", "bookPages", "bookDescription"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.bookTitle === undefined && !('bookTitle' in props)) {
    			console.warn("<Book> was created without expected prop 'bookTitle'");
    		}
    		if (ctx.bookPages === undefined && !('bookPages' in props)) {
    			console.warn("<Book> was created without expected prop 'bookPages'");
    		}
    		if (ctx.bookDescription === undefined && !('bookDescription' in props)) {
    			console.warn("<Book> was created without expected prop 'bookDescription'");
    		}
    	}

    	get bookTitle() {
    		throw new Error("<Book>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bookTitle(value) {
    		throw new Error("<Book>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bookPages() {
    		throw new Error("<Book>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bookPages(value) {
    		throw new Error("<Book>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bookDescription() {
    		throw new Error("<Book>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bookDescription(value) {
    		throw new Error("<Book>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/purchase.svelte generated by Svelte v3.9.1 */

    const file$2 = "src/purchase.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.book = list[i];
    	return child_ctx;
    }

    // (18:4) {#each books as book}
    function create_each_block(ctx) {
    	var li, t0_value = ctx.book.title + "", t0, t1, t2_value = ctx.book.pages + "", t2;

    	return {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(" - ");
    			t2 = text(t2_value);
    			attr(li, "class", "svelte-1v64g92");
    			add_location(li, file$2, 18, 4, 202);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    			append(li, t0);
    			append(li, t1);
    			append(li, t2);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.books) && t0_value !== (t0_value = ctx.book.title + "")) {
    				set_data(t0, t0_value);
    			}

    			if ((changed.books) && t2_value !== (t2_value = ctx.book.pages + "")) {
    				set_data(t2, t2_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var ul, t, h1;

    	var each_value = ctx.books;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			ul = element("ul");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			h1 = element("h1");
    			h1.textContent = "Total : #...";
    			attr(ul, "class", "svelte-1v64g92");
    			add_location(ul, file$2, 16, 0, 167);
    			add_location(h1, file$2, 22, 0, 259);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, ul, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			insert(target, t, anchor);
    			insert(target, h1, anchor);
    		},

    		p: function update(changed, ctx) {
    			if (changed.books) {
    				each_value = ctx.books;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(ul);
    			}

    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(t);
    				detach(h1);
    			}
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { books } = $$props;

    	const writable_props = ['books'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Purchase> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('books' in $$props) $$invalidate('books', books = $$props.books);
    	};

    	return { books };
    }

    class Purchase extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["books"]);

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.books === undefined && !('books' in props)) {
    			console.warn("<Purchase> was created without expected prop 'books'");
    		}
    	}

    	get books() {
    		throw new Error("<Purchase>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set books(value) {
    		throw new Error("<Purchase>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.9.1 */

    const file$3 = "src/App.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.book = list[i];
    	return child_ctx;
    }

    // (61:1) <Button on:click={addBook}>
    function create_default_slot$1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("ADD Book");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (69:1) {:else}
    function create_else_block(ctx) {
    	var each_1_anchor, current;

    	var each_value = ctx.books;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.books) {
    				each_value = ctx.books;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (65:0) {#if books.length === 0}
    function create_if_block(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Add a new book";
    			add_location(p, file$3, 65, 1, 1168);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (70:1) {#each books as book}
    function create_each_block$1(ctx) {
    	var current;

    	var book = new Book({
    		props: {
    		bookTitle: ctx.book.title,
    		bookPages: ctx.book.pages,
    		bookDescription: ctx.book.description
    	},
    		$$inline: true
    	});
    	book.$on("buy", ctx.purchaseBook);

    	return {
    		c: function create() {
    			book.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(book, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var book_changes = {};
    			if (changed.books) book_changes.bookTitle = ctx.book.title;
    			if (changed.books) book_changes.bookPages = ctx.book.pages;
    			if (changed.books) book_changes.bookDescription = ctx.book.description;
    			book.$set(book_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(book.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(book.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(book, detaching);
    		}
    	};
    }

    function create_fragment$3(ctx) {
    	var section0, div0, label0, t1, input0, t2, div1, label1, t4, input1, t5, div2, label2, t7, textarea, t8, t9, section1, current_block_type_index, if_block, t10, hr, t11, section2, current, dispose;

    	var button = new Button({
    		props: {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});
    	button.$on("click", ctx.addBook);

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.books.length === 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	var purchase = new Purchase({
    		props: { books: ctx.purchases },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			section0 = element("section");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "Title";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "Pages";
    			t4 = space();
    			input1 = element("input");
    			t5 = space();
    			div2 = element("div");
    			label2 = element("label");
    			label2.textContent = "Description";
    			t7 = space();
    			textarea = element("textarea");
    			t8 = space();
    			button.$$.fragment.c();
    			t9 = space();
    			section1 = element("section");
    			if_block.c();
    			t10 = space();
    			hr = element("hr");
    			t11 = space();
    			section2 = element("section");
    			purchase.$$.fragment.c();
    			attr(label0, "for", "title");
    			attr(label0, "class", "svelte-nr7xe6");
    			add_location(label0, file$3, 48, 2, 717);
    			attr(input0, "type", "text");
    			attr(input0, "id", "title");
    			input0.value = ctx.title;
    			attr(input0, "class", "svelte-nr7xe6");
    			add_location(input0, file$3, 49, 2, 752);
    			add_location(div0, file$3, 47, 1, 708);
    			attr(label1, "for", "pages");
    			attr(label1, "class", "svelte-nr7xe6");
    			add_location(label1, file$3, 52, 2, 835);
    			attr(input1, "type", "number");
    			attr(input1, "id", "pages");
    			input1.value = ctx.pages;
    			attr(input1, "class", "svelte-nr7xe6");
    			add_location(input1, file$3, 53, 2, 870);
    			add_location(div1, file$3, 51, 1, 827);
    			attr(label2, "for", "description");
    			attr(label2, "class", "svelte-nr7xe6");
    			add_location(label2, file$3, 56, 2, 954);
    			attr(textarea, "rows", "3");
    			attr(textarea, "id", "description");
    			attr(textarea, "class", "svelte-nr7xe6");
    			add_location(textarea, file$3, 57, 2, 1001);
    			add_location(div2, file$3, 55, 1, 946);
    			attr(section0, "class", "svelte-nr7xe6");
    			add_location(section0, file$3, 46, 0, 697);
    			attr(section1, "class", "svelte-nr7xe6");
    			add_location(section1, file$3, 63, 0, 1132);
    			add_location(hr, file$3, 80, 0, 1382);
    			attr(section2, "class", "svelte-nr7xe6");
    			add_location(section2, file$3, 82, 0, 1388);

    			dispose = [
    				listen(input0, "input", ctx.setTitle),
    				listen(input1, "input", ctx.input1_input_handler),
    				listen(textarea, "input", ctx.textarea_input_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, section0, anchor);
    			append(section0, div0);
    			append(div0, label0);
    			append(div0, t1);
    			append(div0, input0);
    			append(section0, t2);
    			append(section0, div1);
    			append(div1, label1);
    			append(div1, t4);
    			append(div1, input1);

    			set_input_value(input1, ctx.pages);

    			append(section0, t5);
    			append(section0, div2);
    			append(div2, label2);
    			append(div2, t7);
    			append(div2, textarea);

    			set_input_value(textarea, ctx.description);

    			append(section0, t8);
    			mount_component(button, section0, null);
    			insert(target, t9, anchor);
    			insert(target, section1, anchor);
    			if_blocks[current_block_type_index].m(section1, null);
    			insert(target, t10, anchor);
    			insert(target, hr, anchor);
    			insert(target, t11, anchor);
    			insert(target, section2, anchor);
    			mount_component(purchase, section2, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed.title) {
    				input0.value = ctx.title;
    			}

    			if (changed.pages) set_input_value(input1, ctx.pages);

    			if (!current || changed.pages) {
    				input1.value = ctx.pages;
    			}

    			if (changed.description) set_input_value(textarea, ctx.description);

    			var button_changes = {};
    			if (changed.$$scope) button_changes.$$scope = { changed, ctx };
    			button.$set(button_changes);

    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(section1, null);
    			}

    			var purchase_changes = {};
    			if (changed.purchases) purchase_changes.books = ctx.purchases;
    			purchase.$set(purchase_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);

    			transition_in(if_block);

    			transition_in(purchase.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(purchase.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(section0);
    			}

    			destroy_component(button);

    			if (detaching) {
    				detach(t9);
    				detach(section1);
    			}

    			if_blocks[current_block_type_index].d();

    			if (detaching) {
    				detach(t10);
    				detach(hr);
    				detach(t11);
    				detach(section2);
    			}

    			destroy_component(purchase);

    			run_all(dispose);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	

    let title = '';
    let pages = 0;
    let description = '';

    let books =[];
    let purchases = [];

    function setTitle(event){
    	$$invalidate('title', title = event.target.value);
    }

    function addBook(){
    	const newBook = {
    		title : title,
    		pages : pages,
    		description: description
    	};
    	$$invalidate('books', books = books.concat(newBook));
    }

    function purchaseBook(event){
    	const selectedTitle= event.detail;
    	$$invalidate('purchases', purchases = purchases.concat({
    		...books.find(book => book.title === selectedTitle)
    	}));
    }

    	function input1_input_handler() {
    		pages = to_number(this.value);
    		$$invalidate('pages', pages);
    	}

    	function textarea_input_handler() {
    		description = this.value;
    		$$invalidate('description', description);
    	}

    	return {
    		title,
    		pages,
    		description,
    		books,
    		purchases,
    		setTitle,
    		addBook,
    		purchaseBook,
    		input1_input_handler,
    		textarea_input_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
