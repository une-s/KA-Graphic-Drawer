/****************************************
 *                                      *
 * Made by Une (@unern) on Khan Academy *
 *                                      *
 ****************************************/

var show = 1;

var main = function() {
    var init = function(pjs) {

        /**
         * Replace this line when you save. Make sure you
         * copy/paste the full string.
         */
        var save = "";

        var VERSION = "1";
        // Track whether Ctrl/Shift/Alt are pressed
        var modifierKeys = {};
        
        var defaults = {
            WIDTH: 400,  // Supports 400, 500, 600
            HEIGHT: 400, // Supports 400, 500, 600
            COLOR: pjs.color(0, 0, 0),
            BRUSH_SIZE: 5,
            ALPHA: 255,
            BLUR: 2
        };

        var Action, Vectors, Graphics, ButtonIcons, SaveLoad;
    
        // Init component classes
        
        // Component - Generic superclass
        var Component = (function() {
            /*
             * The GUI is entirely made up of components.
             * There is one root component, which contains
             * child components, which in turn may contain
             * child components etc.
             * The most generic component class and
             * superclass of all components is Component.
             * Subclasses include Button, Canvas, Slider, …
             */
            
            // Private variables
            
            // The currently pressed component and its
            // ancestors until no more propagation
            var _pressedComps = [];
            // All keyboard focusable components
            var _focusableComps = [];
            // Currently focused component
            var _focusedComp;
            // Currently hovered component
            var _hoveredComp;
            // Info on the fullscreen component,
            // This is null/undefined if no fulscreen comp
            var _fullscreen;
            // Whether changes exist. Contains a bool plus
            // 0 or more functions, each returning a bool.
            // Must redraw view if at least one is  true.
            var _changes = [ false ];
            
            var _getCommonAncestor;
            

            // Constructor

            var Component = function(config) {
                // Make sure config isn't null or undefined
                config = config || {};

                // Initialize comp based on config values

                // Set parent
                (config.parent || Component.root).addChild(this, config);
                // Init children
                this.children = [];
                // Set position
                if(config.x) { this.x = config.x; }
                if(config.y) { this.y = config.y; }
                this.globalX = this.parent.globalX + this.x;
                this.globalY = this.parent.globalY + this.y;
                // Set size
                this.width  = config.width  || this.parent.width;
                this.height = config.height || this.parent.height;
                // Create graphics
                this.graphics = Graphics.create(this.width, this.height);
                // Set background color
                if(config.background !== undefined)
                    { this.background = config.background; }
                // Set foreground color
                if(config.foreground !== undefined)
                    { this.foreground = config.foreground; }
                // Set draw function
                if(config.draw)
                    { this.draw = config.draw; }
                if(config.needsRedraw)
                    { this.needsRedraw = config.needsRedraw; }
                // Set whether hidden
                if(config.hidden)
                    { this.hidden = config.hidden; }
                // Set whether to crop to parent
                if( config.cropToParent ||
                    (config.cropToParent = this.parent.cropToParent) )
                    { this.cropToParent = config.cropToParent; }
                // Add onResize listener
                if(config.onResize)
                    { this.onResize = config.onResize; }
                // Add mouse listeners
                if(config.mousePressed)
                    { this.mousePressed = config.mousePressed; }
                if(config.mouseDragged)
                    { this.mouseDragged = config.mouseDragged; }
                if(config.mouseReleased)
                    { this.mouseReleased = config.mouseReleased; }
                if(config.mouseEntered)
                    { this.mouseEntered = config.mouseEntered; }
                if(config.mouseLeft)
                    { this.mouseLeft = config.mouseLeft; }
                if(config.mouseScrolled)
                    { this.mouseScrolled = config.mouseScrolled; }
                // Add keyboard listeners
                if(config.keyPressed ) { this.keyPressed  = config.keyPressed; }
                if(config.keyTyped   ) { this.keyTyped    = config.keyTyped; }
                if(config.keyReleased) { this.keyReleased = config.keyReleased; }
                // Add focus listeners
                if(config.focusGained) { this.focusGained = config.focusGained; }
                if(config.focusLost  ) { this.focusLost   = config.focusLost; }
                // Set whether focusable
                if(config.focusable !== undefined) {
                    this.focusable = !!config.focusable;
                }
                // If focusable
                if(this.focusable) {
                    // Init focusable component
                    this.tabIndex = _focusableComps.length;
                    _focusableComps.push(this);
                }
            };
            // End of constructor
            
            // Let the root comp be the prototype comp
            Component.root = Component.prototype = {
                generation: 0, // Starts at root = gen 0
                x: 0, // x-position relative to parent
                y: 0, // y-position repative to parent
                globalX: 0, // Global x-position
                globalY: 0, // Global y-position
                width: pjs.width,
                height: pjs.height,
                graphics: pjs,
                children: [],
                background: 0x00ffffff, // Transparent bg
                foreground: 0xff000000, // Black fg
                isPressed: false, // Is pressed by mouse
                focusable: false, // Keyboard-focusable
                needsRedraw: true, // True if call draw(g)
                draw: function(g) {}, // Override
                // Recursively draw all descendants
                drawChildren: function() {
                    // For each child of this component
                    for(var i = 0; i < this.children.length; i++) {
                        var child = this.children[i];
                        // Ignore hidden children
                        if( child.hidden ) { continue; }
                        // If child needs redraw
                        if( child.needsRedraw === true ||
                            typeof child.needsRedraw === 'function' &&
                            child.needsRedraw()
                        ) {
                            // Redraw child
                            child.graphics.beginDraw();
                            child.draw(child.graphics);
                            child.graphics.endDraw();
                        }
                        // Get image
                        var img = child.getCrop();
                        if(img) {
                            // Draw onto the global view
                            pjs.image(img.graphics,
                                    child.globalX + img.x,
                                    child.globalY + img.y);
                        }
                        // Recursion
                        child.drawChildren();
                    }
                },
                // Return a cropped image of this component
                // showing only what's visible on screen.
                // Used when drawing onto the global view
                getCrop: function() {
                    // Corner coordinates
                    var x0 = 0, x1 = pjs.width;
                    var y0 = 0, y1 = pjs.height;
                    var comp = this;
                    do {
                        // Make no larger than necessary
                        x0 = pjs.max(x0, comp.globalX);
                        y0 = pjs.max(y0, comp.globalY);
                        x1 = pjs.min(x1, comp.globalX + comp.width);
                        y1 = pjs.min(y1, comp.globalY + comp.height);
                    } while(comp.cropToParent && (comp = comp.parent));
                    // Don't bother with 0 area images
                    if(x1 <= x0 || y1 <= y0) { return; }
                    // Put image detail in one object
                    var img = {
                        graphics: this.graphics, // The img
                        x: x0 - this.globalX, // x-coord
                        y: y0 - this.globalY, // y-coord
                        width:  x1 - x0,
                        height: y1 - y0
                    };
                    // If crop is smaller than original img
                    if( img.x || img.width  !== this.width ||
                        img.y || img.height !== this.height )
                    {
                        // Make cropped image
                        img.graphics = img.graphics.get(
                            img.x, img.y, img.width, img.height
                        );
                    }
                    // Return image with pos & size detail
                    return img;
                },
                // Set new location of this component
                setLocation: function(x, y) {
                    // If new pos !== old pos
                    if(this.x !== x || this.y !== y) {
                        // Set new pos
                        this.x = x;
                        this.y = y;
                        this.updateGlobalCoords();
                        // Register that view has changed
                        Component.setChange();
                    }
                },
                // Resize this component
                resize: function(w, h) {
                    // If new size  !== old size
                    if(this.width !== w || this.height !== h) {
                        // Store old size
                        var before = {
                            width: this.width,
                            height: this.height
                        };
                        // Set new size
                        this.width = w;
                        this.height = h;
                        // Create graphics with new size
                        this.graphics = Graphics.create(w, h);
                        // Require redraw of this component
                        // so the graphics can be filled in
                        if(!this.needsRedraw) {
                            this.needsRedraw = true;
                        }
                        // If this has onResize listener
                        if(this.onResize) {
                            // Trigger onResize event
                            this.onResize({
                                target: this,
                                before: before
                            });
                        }
                        // Register that view has changed
                        Component.setChange();
                    }
                },
                // Make global coords up to date with local coords
                updateGlobalCoords: function() {
                    // Get new global coords
                    var globalX = this.parent.globalX + this.x;
                    var globalY = this.parent.globalY + this.y;
                    // If new coords !== old coords
                    if(globalX !== this.globalX || globalY !== this.globalY) {
                        // Set new global coords
                        this.globalX = globalX;
                        this.globalY = globalY;
                        // Recursively update global coords of children
                        for(var i = 0; i < this.children.length; i++) {
                            this.children[i].updateGlobalCoords();
                        }
                    }
                },
                // Returns whether the given pt is
                // contained within this component
                containsGlobalPt: function(x, y) {
                    x -= this.globalX;
                    y -= this.globalY;
                    return 0 <= x && x < this.width && 0 <= y && y < this.height;
                },
                // Adds a child to this component
                // unless it already has a parent
                addChild: function(comp, config) {
                    // If chj,d has no parent
                    if(!comp.parent) {
                        // Add child
                        comp.parent = this;
                        comp.generation = this.generation + 1;
                        this.children.push(comp);
                    }
                },
                // Remove child from component
                removeChild: function(index) {
                    this.children[index].hide();
                    this.children.splice(index, 1);
                    Component.setChange();
                },
                // Get descendant at point
                getDescendantAt: function(x, y) {
                    // Switch to global coords
                    var globalX = this.globalX + x;
                    var globalY = this.globalY + y;
                    // For each child
                    for(var i = this.children.length - 1; i >= 0; i--) {
                        var child = this.children[i];
                        // If child visible and contains pt
                        if(!child.hidden && child.containsGlobalPt(globalX, globalY)) {
                            // Recursively get descendant
                            var desc = child.getDescendantAt(x - child.x, y - child.y);
                            // Return descendant or child
                            return desc || child;
                        }
                    }
                },
                // Whether this component is fullscreen
                isFullscreen: function() {
                    return _fullscreen && _fullscreen.comp === this;
                },
                // Toggles fullscreen on/off
                // Currently only works on components that
                // are direct children of the root comp
                toggleFullscreen: function(on) {
                    var fs;
                    // Must be generation 1 to work (i.e.
                    // child of root component) or it could
                    // fall outside the boundaries of its
                    // parent and not be fully drawn.
                    if( this.generation !== 1 ) {
                        return false;
                    }
                    // Ignore if no change
                    if( (on = !!on) === this.isFullscreen() ) {
                        return false;
                    }
                    // Toggle fullscreen on
                    if( on ) {
                        // First toggle off existing fullscreen
                        if( _fullscreen ) {
                            _fullscreen.comp.toggleFullscreen(false);
                        }
                        // Ready new fullscreen object
                        fs = {
                            comp: this,
                            // Store bounds before fullscrn
                            x: this.x,
                            y: this.y,
                            width: this.width,
                            height: this.height
                        };
                        // Make fullscreen
                        this.setLocation(0, 0);
                        this.resize(pjs.width, pjs.height);
                        _fullscreen = fs;
                    }
                    // Toggle fullscreen off
                    else {
                        fs = _fullscreen;
                        _fullscreen = null;
                        // Return to original bounds
                        this.resize(fs.width, fs.height);
                        this.setLocation(fs.x, fs.y);
                    }
                    return true;
                },
                // Press this component
                press: function(x, y) {
                    if(!this.isPressed) {
                        this.isPressed = true;
                        _pressedComps.push(this);
                        // If has mousePressed listener
                        if(this.mousePressed) {
                            // Trigger event on listener
                            return this.mousePressed({x:x, y:y});
                        }
                    }
                },
                // Hover this component
                hover: function() {
                    // Do nothing if already hovered
                    if(_hoveredComp === this) {
                        return;
                    }
                    var comp1 = this; // New
                    var comp2 = _hoveredComp; // Old
                    _hoveredComp = this;
                    // If a previously hovered comp existed
                    if(comp2) {
                        // Get common ancestor of the comps
                        var ancestor = _getCommonAncestor(comp1, comp2);
                        // Trigger mouse leave old branch
                        while(comp2 !== ancestor) {
                            if(comp2.mouseLeft) {
                                comp2.mouseLeft();
                            }
                            comp2 = comp2.parent;
                        }
                        // Trigger mouse enter new branch
                        while(comp1 !== ancestor) {
                            if(comp1.mouseEntered) {
                                comp1.mouseEntered();
                            }
                            comp1 = comp1.parent;
                        }
                    }
                    // If no previously hovered component
                    else {
                        // Trigger mouse enter new
                        // component and all its ancestors
                        while(comp1) {
                            if(comp1.mouseEntered) {
                                comp1.mouseEntered();
                            }
                            comp1 = comp1.parent;
                        }
                    }
                },
                // Returns whether this is the focused comp
                hasFocus: function() {
                    return _focusedComp === this;
                },
                // Grabs focus if focusable & visible
                // Returns whether focus changed
                focus: function() {
                    // If can focus and not already focused
                    if(this.focusable && _focusedComp !== this &&
                            this.isVisible() ) {
                        // Unfocus previous
                        if(_focusedComp) {
                            _focusedComp.blur();
                        }
                        // Focus this
                        _focusedComp = this;
                        // Trigger event
                        if(this.focusGained) {
                            this.focusGained();
                        }
                        // View has changed
                        Component.setChange();
                        // Focus changed
                        return true;
                    }
                    // Focus didn't change
                    return false;
                },
                // Lose keyboard focus
                blur: function() {
                    // If is focused
                    if(_focusedComp === this) {
                        // Unfocus
                        _focusedComp = undefined;
                        // Trigger event
                        if(this.focusLost) {
                            this.focusLost();
                        }
                        // View has changed
                        Component.setChange();
                    }
                },
                // Show comp by setting hidden = false
                // Won't show if an ancestor is hidden
                show: function() {
                    // If hidden
                    if(this.hidden) {
                        // Unhide
                        this.hidden = false;
                        // If comp is visible now
                        // (false if hidden ancestor)
                        if(this.isVisible()) {
                            // View has changed
                            Component.setChange();
                        }
                    }
                },
                // Hide component
                hide: function() {
                    // Return if already hidden
                    if(this.hidden) { return; }
                    // Store whether redraw required
                    var willRedraw = this.isVisible();
                    // Hide comp
                    this.hidden = true;
                    // Unfocus any components inside this
                    if(_focusedComp && _getCommonAncestor(this, _focusedComp) === this) {
                        _focusedComp.blur();
                    }
                    // If redraw required
                    if(willRedraw) {
                        Component.setChange();
                    }
                },
                // Whether this component is visible
                // True if not hidden and does not
                // have a hidden ancestor
                isVisible: function() {
                    // The fullscreen component, if any
                    var fs = Component.getFullscreenComp();
                    // Whether this comp is contained in fs
                    var inFs = false;
                    // For this and all ancestors, do:
                    var comp = this;
                    while(comp) {
                        // Return false if hidden exists
                        if(comp.hidden) {
                            return false;
                        }
                        inFs = inFs || (fs === comp);
                        comp = comp.parent;
                    }
                    // Return true if there is no
                    // fullscreen component, or if this is
                    // inside the fullscreen component
                    return !fs || inFs;
                }
            };
            // End of root component / prototype component

            // Public static methods

            // Draws all components
            Component.drawAll = function() {
                // Pending changes false
                _changes[0] = false;
                // Clear graphics
                pjs.background(255, 255, 255);

                // Get starting comp
                var root = Component.getFullscreenComp() || Component.root;
                // Draw component tree
                if(!Component.root.hidden && !root.hidden) {
                    root.draw(root.graphics);
                    root.drawChildren();
                    // If starting comp is not using the
                    // global graphics
                    if(root.graphics !== pjs) {
                        // Draw it onto the global graphics
                        pjs.image(root.graphics);
                    }
                }
            };
            // Returns the component that is currently
            // fullscreen, or undefined if none
            Component.getFullscreenComp = function() {
                if(_fullscreen) {
                    return _fullscreen.comp;
                }
            };
            // Register that the view has changed.
            // The view will be redrawn in the next frame
            Component.setChange = function() {
                // Set changes to true
                _changes[0] = true;
            };
            // For more advanced change tracking, pass a
            // callback function to this function. If it
            // returns true, the view will be redrawn next
            Component.trackChange = function(func) {
                _changes.push(func);
            };
            // Whether view has changed since last draw
            Component.hasChanges = function() {
                // The _changes array starts with a bool
                // and all subsequent elems are callbacks

                // If simple change has occurred
                if(_changes[0]) {
                    return true;
                }
                // Otherwise go through callback functions
                for(var i = 1; i < _changes.length; i++) {
                    // Return true if change occurred
                    if(_changes[i]()) {
                        return true;
                    }
                }
                // Otherwise return false
                return false;
            };
            // Returns the component at the given coords
            Component.getComponentAt = function(x, y) {
                // Get root
                var root = Component.getFullscreenComp() || Component.root;
                // If point not in root, return
                if(!root.containsGlobalPt(x, y) || root.hidden) {
                    return;
                }
                // Get and return component at point
                var comp = root.getDescendantAt(x, y);
                return comp || root;
            };
            // Invokes mouseDragged on pressed components
            Component.dragPressed = function() {
                // Get mouse pos
                var x = pjs.mouseX;
                var y = pjs.mouseY;
                // Whether to propagate event to parent
                var propagate;
                // For pressed component and its ancestors
                for(var i = 0; i < _pressedComps.length; i++) {
                    var comp = _pressedComps[i];
                    // If has mouseDragged listener
                    if(comp.mouseDragged && propagate !== false) {
                        // Invoke event on listener
                        propagate = comp.mouseDragged({
                            x: x - comp.globalX,
                            y: y - comp.globalY
                        });
                        // Until propagate is false
                    }
                }
            };
            // Unpresses all pressed components
            Component.unpressAll = function() {
                // Get mouse pos
                var x = pjs.mouseX;
                var y = pjs.mouseY;
                // Whether to propagate event to parent
                var propagate;
                // For pressed component and its ancestors
                for(var i = 0; i < _pressedComps.length; i++) {
                    var comp = _pressedComps[i];
                    // Unpress component
                    comp.isPressed = false;
                    // If has mouseReleased listener
                    if(comp.mouseReleased && propagate !== false) {
                        // Invoke event on listener
                        propagate = comp.mouseReleased({
                            x: x - comp.globalX,
                            y: y - comp.globalY
                        });
                        // Until propagate is false
                    }
                }
                // Clear storage
                _pressedComps = [];
            };
            // Returns the focused component
            Component.getFocusedComponent = function() {
                return _focusedComp;
            };
            // Shifts focus to previous focusable component
            Component.focusPrevious = function() {
                var count =  _focusableComps.length;
                // Leave if no focusable component exists
                if(count === 0) { return; }
                // Tab index of last focused comp, or zero
                var from = _focusedComp ? _focusedComp.tabIndex : 0;
                // Iterate through all focusable components
                var i = (from + count - 1) % count;
                while(true) {
                    // If successfully gains keyboard focus
                    if(_focusableComps[i].focus())
                        // Return component
                        { return _focusedComp; }
                    // If all have been iterated through
                    if(i === from)
                        // Return nothing
                        { return; }
                    // Decrement index in a cycle
                    i = (i + count - 1) % count;
                }
            };
            // Shifts focus to the next focusable component
            Component.focusNext = function() {
                var count =  _focusableComps.length;
                // Leave if no focusable component exists
                if(count === 0) { return; }
                // Index of last focused comp, or count-1
                var from = _focusedComp ? _focusedComp.tabIndex : count-1;
                // Iterate through all focusable components
                var i = (from + 1) % count;
                while(true) {
                    // If successfully gains keyboard focus
                    if(_focusableComps[i].focus())
                        // Return component
                        { return _focusedComp; }
                    // If all have been iterated through
                    if(i === from)
                        // Return nothing
                        { return; }
                    // Increment index in a cycle
                    i = (i + 1) % count;
                }
            };
            // Clears focus
            Component.clearFocus = function() {
                if(_focusedComp) {
                    _focusedComp.blur();
                }
            };
            
            // Private functions

            // Gets deepest common ancestor of 2 components
            _getCommonAncestor = function(comp1, comp2) {
                // Make the generations the same
                // by selecting parents of one or the other
                while(comp1.generation > comp2.generation) {
                    comp1 = comp1.parent;
                }
                while(comp2.generation > comp1.generation) {
                    comp2 = comp2.parent;
                }
                // Go up the tree until both are the same
                while(comp1 !== comp2) {
                    comp1 = comp1.parent;
                    comp2 = comp2.parent;
                }
                // Return deepest common ancestor
                return comp1;
            };

            // Component init complete

            // Return fully initialized Component class
            return Component;
        })();
        // Panel - Empty colored container
        var Panel = (function() {

            /*
             * Panel is a colored rectangular container
             * with a thin border around the edges. The
             * toolbar and the container for the brush
             * stroke settings are examples of panels.
             * Other components can be placed inside a
             * panel for a nice layout.
             */

            // Init private vabiables
            var _drawBorder;
            
            // Constructor
            var Panel = function(config) {
                // Make sure config isn't null or undefined
                config = config || {};
                // Let Panel constructor extend Component
                Component.call(this, Object.assign({
                    // Set default background color if
                    // config has no background color set
                    background: pjs.color(81, 95, 99)
                }, config));
            };
            // Let Panel prototype extend Component
            Panel.prototype = Object.assign(Object.create(Component.prototype), {
                // Override draw function
                draw: function(g) {
                    // Draw background
                    g.background(this.background);
                    // Draw border
                    _drawBorder(g,2,pjs.color(143, 143, 143),pjs.color(1, 15, 54));
                    // No need to redraw
                    this.needsRedraw = false;
                }
            });
            // End of Panel.prototype

            // Draws the border around the edges
            _drawBorder = function(g, thickness, cT, cB, cL, cR) {
                // cT - Color top (required)

                // Color bottom (default to cT if absent)
                cB = cB === undefined ? cT : cB;
                // Color left (default to cT if absent)
                cL = cL === undefined ? cT : cL;
                // Color right (default to cB if absent)
                cR = cR === undefined ? cB : cR;

                // Utility vars
                var w = g.width;
                var h = g.height;

                // Store current stroke/fill style
                g.pushStyle();

                g.noStroke();
                // Draw top
                g.fill(cT);
                g.quad(0,0,thickness,thickness,w-thickness,thickness,w,0);
                // Draw bottom
                g.fill(cB);
                g.quad(w,h,w-thickness,h-thickness,thickness,h-thickness,0,h);
                // Draw left
                g.fill(cL);
                g.quad(0,h,thickness,h-thickness,thickness,thickness,0,0);
                // Draw right
                g.fill(cR);
                g.quad(w,0,w-thickness,thickness,w-thickness,h-thickness,w,h);
                // Revert back to stored stroke/fill style
                g.popStyle();
            };

            // Panel init complete.

            // Return fully initialized Panel class
            return Panel;
        })();
        // Button - A regular button
        var Button = (function() {

            /*
             * A button is a type of component.
             * To make a button interactive, pass an
             * onToggle callback function to the Button's
             * constructor.
             */

            // Private variables
            // Constants
            var _MARGIN = 3; // Margin inside button
            var _DEFAULT_SIZE = 34; // Btn width/height
            // Private function variables
            var _redrawIcon;

            // The constructor
            var Button = function(config) {
                // Make sure config isn't null or undefined
                config = config || {};
                // Have Button constructor extend Component
                Component.call(this, Object.assign({
                    // Set default width & height if not
                    // set by config
                    width: _DEFAULT_SIZE,
                    height: _DEFAULT_SIZE
                },config));
                // If button belongs in a group, that is,
                // only one button in the group can be
                // selected at the same time
                if(config.buttonGroup) {
                    this.buttonGroup = config.buttonGroup;
                    this.buttonGroup.push(this);
                }
                // Set click behavior. Possible values:
                // - Button.TOGGLE
                // - Button.ACTIVATE
                // - Button.DEACTIVATE
                // See below constructor for meaning
                if(config.clickBehavior)
                    { this.clickBehavior = config.clickBehavior; }
                // What happens on toggle/click
                if(config.onToggle) { this.onToggle = config.onToggle; }
                // Whether btn is active/pressed/selected
                if(config.isActive) { this.setActive(true); }
                // Whether button is enabled/clickable
                if(config.isEnabled === false) { this.setEnabled(false); }
                // Set drawIcon function if exists
                if(config.drawIcon) {
                    this.drawIcon = config.drawIcon;
                    _redrawIcon(this);
                    if(config.iconNeedsRedraw)
                        { this.iconNeedsRedraw = config.iconNeedsRedraw; }
                }
                // Otherwise, set icon if exists
                else if(config.icon) {
                    // Set icon
                    this.icon = config.icon.__isPImage ?
                            ButtonIcons.fromImage(config.icon) :
                            config.icon;
                    // If a separate icon exists for when
                    // the button is active, add that too
                    if(config.iconActive) {
                        this.iconActive = config.iconActive.__isPImage ?
                                ButtonIcons.fromImage(config.iconActive) :
                                config.iconActive;
                    }
                }
                // Otherwise, fallback to Winston icon
                else {
                    this.icon = ButtonIcons.winston;
                }
                // Set background color on hover
                if(config.backgroundHover)
                    { this.backgroundHover = config.backgroundHover; }
                // Set background color when active
                if(config.backgroundActive)
                    { this.backgroundActive = config.backgroundActive; }
            };
            // End of Button constructor

            // Button click behaviors:

            // Toggles between active and inactive when
            // pressed.
            Button.TOGGLE     = 'toggle';
            // Activates when pressed.
            // Stays actve if pressed more than once.
            Button.ACTIVATE   = 'activate';
            // Active only while mouse is down.
            // Deactivates on release.
            Button.DEACTIVATE = 'deactivate';

            // Have Button prototype extend Component
            Button.prototype = Object.assign(Object.create(Component.prototype), {
                // Defaults
                isEnabled: true,
                isActive: false,
                clickBehavior: Button.DEACTIVATE,
                background:       pjs.color(204, 210, 217),
                backgroundHover:  pjs.color(192, 196, 209),
                backgroundActive: pjs.color(38, 60, 92),
                foreground:       pjs.color(11, 41, 61),
                foregroundActive: pjs.color(178, 226, 240),
                // On mouse enter
                mouseEntered: function() {
                    // Do nothing if disabled
                    if(!this.isEnabled)
                        { return; }
                    // Put button in hover state
                    this.isBtnHovered = true;
                    // If button is clickale
                    if(this.clickBehavior !== Button.ACTIVATE || !this.isActive) {
                        // Chabge cursor to pointing hand
                        pjs.cursor(pjs.HAND);
                        // If button may look different now
                        if(!this.isActive) {
                            // View has changed
                            Component.setChange();
                        }
                    }
                },
                // On mouse leave
                mouseLeft: function() {
                    // Unhover
                    this.isBtnHovered = false;
                    // Change cursor back to default
                    pjs.cursor(pjs.ARROW);
                    // If button may look different now
                    if(this.isEnabled && !this.isActive) {
                        // View has changed
                        Component.setChange();
                    }
                },
                // On mouse pressed
                mousePressed: function() {
                    // Do nothing if disabled
                    if(!this.isEnabled)
                        { return false; }
                    // Activate/deactivate button.
                    // onToggle is called here.
                    this.setActive( this.clickBehavior !== Button.TOGGLE ||
                                   !this.isActive);
                    // Set correct cursor type
                    if(this.clickBehavior === Button.ACTIVATE && this.isActive) {
                        pjs.cursor(pjs.ARROW);
                    }
                    // Don't propagate event to parent
                    return false;
                },
                // On mouse released
                mouseReleased: function() {
                    // If click behavior says deactivate
                    // on mouse release
                    if(this.clickBehavior === Button.DEACTIVATE) {
                        // Deactivate.
                        // onToggle is called here
                        this.setActive(false);
                    }
                },
                // Changes state of the button to active
                // or inactive. The onToggle function is
                // called by this function.
                setActive: function(active) {
                    // If old state !== new state
                    if(this.isActive !== (active = !!active)) {
                        // Change state
                        this.isActive = active;
                        // Call onToggle.
                        // Button action happens here.
                        if(this.onToggle) {
                            this.onToggle(active);
                        }
                        // If btn belongs in a group, I.e.
                        // only one can be active at once
                        if(active && this.buttonGroup) {
                            // Go through all btns in group
                            for(var i = 0; i < this.buttonGroup.length; i++) {
                                var btn = this.buttonGroup[i];
                                // For all btns except this
                                if(btn !== this) {
                                    // Set as inactive
                                    btn.setActive(false);
                                }
                            }
                        }
                        // View has changed
                        Component.setChange();
                    }
                },
                // Enables or disables button
                setEnabled: function(enabled) {
                    // If old state !== new state
                    if(this.isEnabled !== (enabled = !!enabled)) {
                        // Set new state
                        this.isEnabled = enabled;
                        // If disabled
                        if(!enabled) {
                            // Turn off hover state
                            this.isBtnHovered = false;
                            // Make inactive
                            this.setActive(false);
                        }
                        // View has changed
                        Component.setChange();
                    }
                },
                // Draws the button
                draw: function(g) {
                    // Set relevant background color
                    g.fill(this.isActive     ? this.backgroundActive :
                          (this.isBtnHovered ? this.backgroundHover  :
                                               this.background));
                    // Draw background
                    g.rect(0, 0, g.width-1, g.height-1, 3);
                    // If icon needs redraw
                    if( this.iconNeedsRedraw === true ||
                        typeof this.iconNeedsRedraw === 'function' &&
                        this.iconNeedsRedraw()
                    ) {
                        // Redraw icon
                        _redrawIcon(this);
                    }
                    // Get icon
                    var icon = (this.isActive && this.iconActive) || this.icon;
                    // Draw icon onto button
                    Graphics.image(g, icon,
                            _MARGIN, _MARGIN,
                            g.width - 2*_MARGIN, g.height - 2*_MARGIN,
                            this.isEnabled ? 255 : 60);
                }
            });
            // End of Button.prototype

            // Static functions

            // Creates a btn icon by taking a draw function
            Button.createIcon = function(drawFunc, btnW, btnH) {
                // Get width and height
                btnW = btnW || _DEFAULT_SIZE;
                btnH = btnH || _DEFAULT_SIZE;
                // Create graphics
                var g = Graphics.create(btnW - 2*_MARGIN, btnH - 2*_MARGIN);
                // Draw icon onto graphics
                g.beginDraw();
                drawFunc(g);
                g.endDraw();
                // Return completed graphics
                return g;
            };

            // Private functions

            // Redraws the icon of a given button
            _redrawIcon = function(btn) {
                // Return if nothing to redraw
                if(!btn.drawIcon) { return; }
                // Set new icon
                btn.icon = Button.createIcon(
                        btn.drawIcon.bind(btn),
                        btn.width,
                        btn.height);
            };
            
            // Button init complete

            // Return fully initialized Button class
            return Button;
        })();
        // ColorPicker - Visual color picker
        var ColorPicker = (function() {

            /*
             * The color picker consists of a color wheel
             * with a triangle inside, in all consisting of
             * every possible color. Pressing the
             * surrounding circle will select the hue,
             * while pressing the triangle inside will
             * select the saturation and brightness.
             * Transparent colors are not part of the color
             * picker, (though transparency is available
             * separately).
             */

            // Constants
            // Distance from center to...
            var _R_OUTER = 0.95; // ...outer end of circle
            var _R_INNER = 0.8; // ...inner end of circle
            var _R_TRIANGLE = 0.75; // ...triangle vertices
            // Identifier for...
            var _HUE_SECTION = 0; // ...circle section
            var _SB_SECTION = 1; // ...triangle section
            
            // Private functions
            var _getTrianglePts, _getSBAt, _setHuePoint, _setSBPoint, _getSBPoint;

            // Constructor
            var ColorPicker = function(config) {
                // Make sure config isn't null or undefined
                config = config || {};
                // Accept size instead of width/height
                // because the component is always square
                delete config.width;
                delete config.height;
                if(config.size) { this.size = config.size; }
                // Have ColorPicker extend Component
                Component.call(this, Object.assign({
                    // Let width === height
                    width:  this.size,
                    height: this.size,
                }, config));
                // Add color change listener
                if(config.onColorChange) {
                    this.onColorChange = config.onColorChange;
                }
                // Set starting color
                this.setColor(config.color || defaults.COLOR);
            };
            // End of constructor

            // Have ColorPicker prototype extend Component
            ColorPicker.prototype = Object.assign(Object.create(Component.prototype), {
                // Default size
                size: 140,
                // Sets the color
                setColor: function(clr) {
                    // Find and set the HSB color values.
                    this.setHSB(pjs.hue(clr), pjs.saturation(clr), pjs.brightness(clr),clr);
                },
                // Sets the HSB color values individually.
                // If the precise RGB value is known,
                // it can be passed as a 4th parameter.
                // Otherwise it'll be calculated from HSB.
                setHSB: function(hue, sat, bri, clr) {
                    // Remove any transparency
                    if(clr !== undefined) { clr |= 0xff000000; }

                    // Get graphics object for access to
                    // HSB-based color function
                    var g = this.graphics;
                    g.colorMode(pjs.HSB);
                    // Get previous HSB color values
                    var hsb = this.hsb;
                    // If new color differs from old color
                    if(
                        !hsb || hue !== hsb[0] || sat !== hsb[1] || bri !== hsb[2] ||
                        (clr && clr !== this.color)
                    ) {
                        // Store new HSB values
                        this.hsb = [hue, sat, bri];
                        // Store new exact color
                        this.color = clr || g.color(hue, sat, bri);
                        // Store new angle
                        this.angle = 24/17 * hue;
                        // Trigger color change event
                        // on listener
                        if(this.onColorChange) {
                            this.onColorChange();
                        }
                        // View has changes
                        Component.setChange();
                    }
                },
                // Draws the color wheel
                draw: function(g) {
                    // Calculate constants
                    
                    // Half of component size
                    var halfSz = this.size/2 | 0;
                    // Radius of outer end of circle
                    var rOut = _R_OUTER * halfSz;
                    // Radius of inner end of circle
                    var rIn  = _R_INNER * halfSz;
                    // Squared values for convenience
                    var rOutSq = rOut * rOut;
                    var rInSq  = rIn  * rIn;
                    // Array of triangle vertex coords
                    var trianglePts = _getTrianglePts(_R_TRIANGLE*halfSz, this.angle);
                    // Use HSB
                    g.colorMode(pjs.HSB);
                    g.background(0, 0, 0, 0);
                    // Ready for pixel manipulation
                    g.loadPixels();
                    var data = g.imageData.data;
                    // Go through all pixels
                    // (x,y) = current pixel coords
                    // i = idx of curr pixel in data array
                    for(var y = -halfSz, i = 0; y < halfSz; y++, i += (this.size&1) << 2) {
                        for(var x = -halfSz; x < halfSz; x++, i += 4) {
                            // Get polar coords of pixel
                            // var sb - for later use
                            var distSq = x*x + y*y, sb;
                            var angle = (pjs.atan2(-y, x) + 360) % 360;
                            // If current pixel is in the
                            // circle section (hue section)
                            if(rInSq < distSq && distSq < rOutSq) {
                                // Get color
                                var clr = g.color(17/24 * angle, 255, 255);
                                // Set pixel color vals
                                data[i    ] = pjs.red(clr);
                                data[i + 1] = pjs.green(clr);
                                data[i + 2] = pjs.blue(clr);
                                data[i + 3] = 255; // Alpha
                            }
                            // Otherwise, if current pixel
                            // is in the triangle section:
                            // Get SB vals (HSB with no H)
                            else if( (sb = _getSBAt(x, y, trianglePts)) ) {
                                // Get color from HSB
                                var clr = g.color(this.hsb[0], sb[0], sb[1]);
                                // Set pixel color vals
                                data[i    ] = pjs.red(clr);
                                data[i + 1] = pjs.green(clr);
                                data[i + 2] = pjs.blue(clr);
                                data[i + 3] = 255; // Alpha
                            }
                        }
                    }
                    // Pixel manipulation complete - update
                    g.updatePixels();
                    
                    // Store current transform
                    g.pushMatrix();
                    // Center coordinates
                    g.translate(halfSz, halfSz);
                    
                    // Draw with black
                    g.noFill();
                    g.stroke(0);

                    // Mark selected pt in triangle section
                    g.strokeWeight(0.02*halfSz);
                    var pt = _getSBPoint(this, trianglePts);
                    g.ellipse(pt.x, pt.y, 0.1*halfSz, 0.1*halfSz);
                    
                    // Rotate coordinates
                    g.rotate(-pjs.radians(this.angle));
                    
                    // Mark selected pt in circle section
                    var strokeWt = 0.04*halfSz;
                    g.strokeWeight(strokeWt);
                    var ht = 0.12*halfSz; // rect height
                    g.rect(rIn - 0.5*strokeWt,-0.5*ht,rOut - rIn + strokeWt,ht);

                    // Revert to stored transform
                    g.popMatrix();
                    
                    // Cache
                    this.lastDrawnColor = this.color;
                    this.lastDrawnAngle = this.angle;
                },
                // Returns whether the color picker needs
                // to be redrawn
                needsRedraw: function() {
                    // Return whether last drawn color and
                    // angle are up to date
                    return  this.lastDrawnColor !== this.color ||
                            this.lastDrawnAngle !== this.angle;
                },
                // Invoked when color picker is pressed
                mousePressed: function(e) {
                    // Calculate constants
                    var halfSz = this.size/2 | 0;
                    var rOut = _R_OUTER * halfSz;
                    var rIn  = _R_INNER * halfSz;
                    // Use center as origin
                    e.x -= halfSz; // Mouse X
                    e.y -= halfSz; // Mouse Y
                    // Get distance from center
                    var dist = pjs.sqrt(e.x * e.x + e.y * e.y);
                    // If mouse pressed in circle section
                    if(rIn <= dist && dist <= rOut) {
                        // What section is pressed/dragged.
                        // Required by mouseDragged func
                        this.draggedSection = _HUE_SECTION;
                        // Set new point (circle section).
                        // Will notify that view changed
                        _setHuePoint(this, e.x, e.y);
                    } else {
                        // Get triangle vertex coords
                        var triPts = _getTrianglePts(_R_TRIANGLE*halfSz, this.angle);
                        // Get saturation and brightness of
                        // pressed pt. Returns undefined if
                        // triangle section wasn't pressed
                        var sb = _getSBAt(e.x, e.y, triPts);
                        // If triangle section was pressed
                        if(sb) {
                            // Triangle section is pressed.
                            // Info for mouseDragged func.
                            this.draggedSection = _SB_SECTION;
                            // Set new pt (triangle sectn)
                            this.setHSB(this.hsb[0], sb[0], sb[1]);
                        }
                        // Otherwise,
                        // nothing significant is pressed
                        else {
                            // No section is pressed
                            this.draggedSection = undefined;
                            return;
                        }
                    }
                },
                // Invoked when mouse is dragged on this
                mouseDragged: function(e) {
                    // Use center as origin
                    e.x -= this.size/2 | 0;
                    e.y -= this.size/2 | 0;
                    // Check what section is dragged
                    switch(this.draggedSection) {
                        // If circle (hue) section
                        case _HUE_SECTION:
                            // Set new hue point
                            _setHuePoint(this, e.x, e.y);
                            break;
                        // If triangle (sat & bri) section
                        case _SB_SECTION:
                            // Set new sat & bri point
                            _setSBPoint(this, e.x, e.y);
                            break;
                        // Do nothing if nothing is dragged
                        default:
                            return;
                    }
                }
            });
            // End of ColorPicker.prototype

            // Private functions

            // Returns coords of the triangle's 3 vertices
            // r = distance from center to each vertex
            // angle = how much the triangle is rotated by
            _getTrianglePts = function(r, angle) {
                var cosA = pjs.cos(angle);
                var sinA = pjs.sin(angle);
                var sqrtP75 = pjs.sqrt(0.75);
                return [
                    {x: r*cosA, y: -r*sinA},
                    {x: r*(-0.5*cosA - sqrtP75*sinA), y: r*(0.5*sinA - sqrtP75*cosA)},
                    {x: r*(-0.5*cosA + sqrtP75*sinA), y: r*(0.5*sinA + sqrtP75*cosA)}
                ];
            };
            // Returns the saturation and brightness at the
            // given coords (x,y) inside the given triangle
            // (pts). For coords outside the triangle,
            // returns nothing if adjust is false (default)
            // or picks the closest point inside the
            // triangle if adjust is true.
            _getSBAt = function(x, y, pts, adjust) {
                // To divide by
                var div = 1.5*(pts[0].x*pts[0].x + pts[0].y*pts[0].y);
                // Saturation times brightness (range 0-1)
                var satTimesBri = (
                    (x + 0.5*pts[0].x) * pts[0].x +
                    (y + 0.5*pts[0].y) * pts[0].y
                ) / div;
                // Brightness (in range 0-1)
                var bri = -(
                    (x -= pts[2].x) * pts[2].x +
                    (y -= pts[2].y) * pts[2].y
                ) / div;
                // If coords are outside one of the edges
                if(satTimesBri < 0) {
                    // Move inside if adjust is true
                    if(adjust) {
                        bri = pjs.constrain(bri - 0.5 * satTimesBri, 0, 1);
                        satTimesBri = 0;
                    }
                    // Otherwise return nothing
                    else { return; }
                }
                // Or, if coords are outside another edge
                else if(bri > 1) {
                    // Move inside if adjust is true
                    if(adjust) {
                        satTimesBri -= 0.5 * (bri - 1);
                        bri = 1;
                        satTimesBri = pjs.constrain(satTimesBri, 0, 1);
                    }
                    // Otherwise return nothing
                    else { return; }
                }
                // Or, if coords are outside the last edge
                else if(satTimesBri > bri) {
                    // Move inside if adjust is true
                    if(adjust) {
                        var diff = 0.5 * (satTimesBri - bri);
                        satTimesBri = pjs.constrain(satTimesBri - diff, 0, 1);
                        bri = pjs.constrain(bri + diff, 0, 1);
                    }
                    // Otherwise return nothing
                    else { return; }
                }
                // Find the saturation (range 0-1)
                var sat = satTimesBri / bri || 0;
                // Return sat and bri (range 0-255)
                return [255*sat, 255*bri];
            };
            // Sets the hue of the color picker based on
            // selected coordinates
            _setHuePoint = function(clrPicker, x, y) {
                // Calculate angle (range 0-360)
                var angle = (pjs.atan2(-y, x) + 360) % 360;
                // Calculate hue (range 0-255)
                var hue = 17/24 * angle;
                // Set new hue
                clrPicker.setHSB(hue, clrPicker.hsb[1], clrPicker.hsb[2]);
            };
            // Sets the saturation and brightness of the
            // color picker based on selected coordinates
            _setSBPoint = function(clrPicker, x, y) {
                // Half the color picker size
                var halfSz = clrPicker.size/2 | 0;
                // Get the triangle vertex coords
                var trianglePts = _getTrianglePts(_R_TRIANGLE*halfSz, clrPicker.angle);
                // Get the saturation and brightness
                var sb = _getSBAt(x, y, trianglePts, true);
                // Set new saturation and brightness
                clrPicker.setHSB(clrPicker.hsb[0], sb[0], sb[1]);
            };
            // Gets the coordinates for the currently
            // selected color inside the triangle
            _getSBPoint = function(clrPicker, trianglePts) {
                // Get current sat and bri (range 0-1)
                var sat = clrPicker.hsb[1] / 255;
                var bri = clrPicker.hsb[2] / 255;
                // Calculate and return coordinates
                return {
                    x:  sat * bri * trianglePts[0].x +
                        (1-sat)*bri*trianglePts[1].x +
                        (1 - bri) * trianglePts[2].x,
                    y:  sat * bri * trianglePts[0].y +
                        (1-sat)*bri*trianglePts[1].y +
                        (1 - bri) * trianglePts[2].y
                };
            };

            // ColorPicker init complete

            // Return fully initialized ColorPicker class
            return ColorPicker;
        })();
        // Input - Field for entering text or numbers
        var Input = (function() {

            var _BLINK_DURATION = 1600;
            var _lastBlink = 0;
            var _blinkStep = 0; // 0 to show bar, 1 to not show bar
            var _mouseScrolled;
            
            var Input = function(config) {
                config = config || {};
                Component.call(this, Object.assign({
                    width: 36,
                    height: 22,
                    background: pjs.color(221, 221, 230),
                }, config));
                if(config.isNumberInput) {
                    this.isNumberInput = true;
                    this.text = '0';
                    this.align = pjs.RIGHT;
                    this.mouseScrolled = _mouseScrolled;
                }
                if(config.text !== undefined) { this.text = config.text.toString(); }
                if(config.align) { this.align = config.align; }
                if(config.onChange) { this.onChange = config.onChange; }
            };
            Input.prototype = Object.assign(Object.create(Component.prototype), {
                focusable: true,
                text: '',
                align: pjs.LEFT,
                mouseEntered: function() {
                    pjs.cursor(pjs.TEXT);
                },
                mouseLeft: function() {
                    pjs.cursor(pjs.ARROW);
                },
                keyPressed: function() {
                    var text = this.text;
                    if(32 <= pjs.key && pjs.key < 0xffff) {
                        this.text += pjs.key.toString();
                    } else {
                        switch(pjs.keyCode) {
                        case pjs.BACKSPACE:
                            if(!text) {
                                return;
                            }
                            this.text = text.substring(0,text.length-1);
                            break;
                        case pjs.TAB:
                            return;
                        case pjs.ESC:
                            Component.clearFocus();
                            return;
                        default:
                            return;
                        }
                    }
                    if(this.isNumberInput) {
                        this.text = this.text === '0-' || this.text === '-0-' ?
                                '-0' :
                                pjs.parseInt(this.text).toString();
                    }
                    if(this.onChange) {
                        this.onChange();
                    }
                    if(this.text !== text) {
                        Component.setChange();
                    }
                },
                focusGained: function() {
                    _lastBlink = pjs.millis();
                    _blinkStep = 0;
                },
                draw: function(g) {
                    g.background(0, 0, 0, 0);
                    if(this.hasFocus()) {
                        g.noStroke();
                        g.fill(184, 204, 255);
                        g.rect(0, 0, this.width, this.height);
                    }
                    g.stroke(0);
                    g.fill(this.background);
                    g.rect(2, 2, this.width - 4, this.height - 4);
                    g.textAlign(pjs.LEFT, pjs.CENTER);
                    g.fill(this.foreground);
                    var textW = pjs.textWidth(this.text);
                    var textX = (
                        ( this.align === pjs.LEFT ? 5 :
                        ( this.align === pjs.CENTER ? 0.5*(this.width - textW) :
                        ( this.align === pjs.RIGHT ? this.width - textW - 5 :
                          5 )))
                    );
                    g.text(this.text, textX, this.height/2);
                    if(this.hasFocus() && _blinkStep === 0) {
                        g.rect(textX + textW, 5, 1, this.height-11);
                    }
                }
            });
            
            Component.trackChange(function() {
                var comp = Component.getFocusedComponent();
                if(comp && comp.draw === Input.prototype.draw) {
                    var time = pjs.millis();
                    var dur = time - _lastBlink;
                    if(dur > _BLINK_DURATION) {
                        _lastBlink = time;
                        _blinkStep = 0;
                        return true;
                    } else if(!_blinkStep && dur > 0.5 * _BLINK_DURATION) {
                        _blinkStep = 1;
                        return true;
                    }
                }
                return false;
            });
            
            _mouseScrolled = function(scroll) {
                var text = this.text;
                this.text = (+text + scroll).toString();
                if(this.onChange) {
                    this.onChange();
                }
                if(this.text !== text) {
                    Component.setChange();
                }
                return false;
            };
            
            return Input;
        })();
        var Slider = (function() {
            
            var _HEIGHT = 18;
            var _WIDTH = 100;
            
            var _xToValue;
            
            var Slider = function(config) {
                config = config || {};
                Component.call(this, Object.assign({
                    height: _HEIGHT,
                    width: _WIDTH
                }, config));
                if(config.min !== undefined)
                    { this.min = config.min; }
                if(config.max !== undefined)
                    { this.max = config.max; }
                if(config.onChange)
                    { this.onChange = config.onChange; }
                this.setValue(config.value !== undefined ? config.value : this.min);
            };
            Slider.prototype = Object.assign(Object.create(Component.prototype), {
                min: 0,
                max: 100,
                isActive: false,
                foreground: Button.prototype.background,
                foregroundActive: pjs.color(157, 232, 162),
                mouseEntered: function() {
                    pjs.cursor(pjs.HAND);
                },
                mouseLeft: function() {
                    pjs.cursor(pjs.ARROW);
                },
                mousePressed: function(e) {
                    this.setValue(_xToValue(this, e.x));
                    this.setActive(true);
                },
                mouseDragged: function(e) {
                    this.setValue(_xToValue(this, e.x));
                },
                mouseReleased: function(e) {
                    this.setActive(false);
                },
                mouseScrolled: function(scroll) {
                    this.setValue(this.value + scroll);
                    return false;
                },
                setActive: function(active) {
                    active = !!active;
                    if(active !== this.isActive) {
                        this.isActive = active;
                        this.needsRedraw = true;
                        Component.setChange();
                    }
                },
                setValue: function(val) {
                    val = pjs.constrain(val, this.min, this.max);
                    if(val !== this.value) {
                        this.value = val;
                        if(this.onChange)
                            { this.onChange(); }
                        this.needsRedraw = true;
                        Component.setChange();
                    }
                },
                draw: function(g) {
                    var y = 0.5*g.height;
                    var xMin = 0.5*g.height;
                    var xMax = g.width - xMin;
                    var xVal = xMin + (xMax - xMin) *
                            (this.value - this.min) /
                            (this.max   - this.min);
                    g.background(0, 0, 0, 0);
                    g.strokeWeight(0.6 * g.height);
                    g.stroke(63, 69, 87);
                    g.line(xMin, y, xMax, y);
                    g.strokeWeight(0.25 * g.height);
                    g.stroke(120, 250, 180);
                    g.line(xMin, y, xVal, y);
                    g.stroke(177, 179, 178);
                    g.line(xVal, y, xMax, y);
                    g.noStroke();
                    g.fill( this.isActive  ? this.foregroundActive :
                                             this.foreground );
                    g.ellipse(xVal, y, g.height, g.height);
                    this.needsRedraw = false;
                }
            });
            
            _xToValue = function(comp, x) {
                var xMin = 0.5*comp.height;
                var xMax = comp.width - xMin;
                return comp.min + (comp.max - comp.min)*(x - xMin)/(xMax - xMin);
            };
            
            return Slider;
        })();
        var Canvas = (function() {
            
            var _tools, _layerProto;
            var _initOrUpdate, _toUserCoords, _drawAction, _dist, _playback;
            
            var Canvas = function(config) {
                config = config || {};
                Component.call(this, config);
                if(config.tool) { this.setTool(config.tool); }
                if(config.imageWidth ) { this.imageWidth  = config.imageWidth; }
                if(config.imageHeight) { this.imageHeight = config.imageHeight; }
                if(config.backgroundOuter)
                    { this.backgroundOuter = config.backgroundOuter; }
                if(config.onLayerChange)
                    { this.onLayerChange = config.onLayerChange; }
                _initOrUpdate(this);
            };
            Canvas.prototype = Object.assign(Object.create(Component.prototype), {
                imageWidth: defaults.WIDTH,
                imageHeight: defaults.HEIGHT,
                background: pjs.color(255, 255, 255),
                backgroundOuter: pjs.color(63, 69, 87),
                tool: 0,
                color: pjs.color(0),
                alpha: defaults.ALPHA,
                size: defaults.BRUSH_SIZE,
                blur: defaults.BLUR,
                currentLayer: -1,
                currentAction: -1,
                actionInProgress: false,
                setTool: function(val) {
                    if(typeof val === 'string') {
                        val = _tools[val.toUpperCase()];
                    }
                    if(_tools[val]) {
                        this.tool = val;
                        return true;
                    }
                    return false;
                },
                getTool: function() {
                    return _tools[this.tool];
                },
                draw: function(g) {
                    var w = this.imageWidth;
                    var h = this.imageHeight;
                    g.background(this.backgroundOuter);
                    g.fill(this.background);
                    g.noStroke();
                    g.rect(0, 0, w, h);
                    for(var i = 0; i < this.layers.length; i++) {
                        var layer = this.layers[i];
                        if(layer.isVisible) {
                            var g2 = layer.graphics;
                            if(i === this.currentLayer && this.actionInProgress) {
                                var action = this.actions[this.currentAction];
                                g2 = Graphics.create(w, h);
                                g2.beginDraw();
                                g2.image(layer.graphics, 0, 0);
                                _drawAction(g2, action);
                                g2.endDraw();
                            }
                            g.image(g2, 0, 0);
                        }
                    }
                    this.needsRedraw = false;
                },
                undoAll: function() {
                    // TODO: Fill in.
                    // To keep in mind:
                    // - LayerList.prototype.update needs
                    //   fixing for when clearing layers
                    // - leyersPanel's layersAdded variable
                },
                playback: function(stopAt) {
                    if(stopAt === undefined)
                        { stopAt = this.actions.length - 1; }
                    if(stopAt === -1)
                        { return; }
                    if(this.currentAction > -1) {
                        this.undoAll();
                    }

                    var canvas = this;
                    canvas.toggleFullscreen(true);
                    canvas.playStop = stopAt;
                    
                    var worker = Worker.getWorker();
                    worker.addRepeatedTask(_playback.bind(this));
                    worker.addSingleTask(function() {
                        canvas.playStop = undefined;
                    });
                },
                isPlayingBack: function() {
                    if(!this.isFullscreen() || this.playStop === undefined)
                        { return false; }
                    return this.playStop > this.currentAction;
                },
                toggleFullscreen: function(on) {
                    var sup = Component.prototype;
                    var change = sup.toggleFullscreen.call(this, on);
                    if(change) {
                        _initOrUpdate(this);
                    }
                    return change;
                },
                mousePressed: function(e) {
                    if(this.isFullscreen()) {
                        if(!this.isPlayingBack())
                            { this.toggleFullscreen(false); }
                        return;
                    }
                    e = _toUserCoords(this, e.x, e.y);
                    if(pjs.mouseButton === pjs.LEFT) {
                        var layer = this.layers[this.currentLayer];
                        if(!layer || !layer.isVisible) {
                            return;
                        }
                        var w = this.imageWidth;
                        var h = this.imageHeight;
                        switch(this.tool) {
                            case _tools.BRUSH:
                                this.addAction({
                                    action: Action.DRAW,
                                    color: this.color,
                                    alpha: this.alpha,
                                    size: this.size,
                                    blur: this.blur,
                                    points: [e.x, e.y],
                                    tempData: {
                                        drawnPts: 0,
                                        graphics: Graphics.create(w, h)
                                    }
                                }, true);
                                break;
                            case _tools.ERASER:
                                this.addAction({
                                    action: Action.ERASE,
                                    alpha: this.alpha,
                                    size: this.size,
                                    blur: this.blur,
                                    points: [e.x, e.y],
                                    tempData: {
                                        drawnPts: 0,
                                        graphics: Graphics.create(w, h, -1)
                                    }
                                }, true);
                                break;
                        }
                        this.needsRedraw = true;
                        Component.setChange();
                    }
                },
                mouseDragged: function(e) {
                    if(this.actionInProgress) {
                        e = _toUserCoords(this, e.x, e.y);
                        var action = this.actions[this.currentAction];
                        action.points.push(e.x, e.y);
                        this.needsRedraw = true;
                        Component.setChange();
                    }
                },
                mouseReleased: function(e) {
                    if(this.actionInProgress) {
                        this.actionInProgress = false;
                        var action = this.actions[this.currentAction];
                        var g = this.layers[this.currentLayer].graphics;
                        g.beginDraw();
                        _drawAction(g, action);
                        g.endDraw();
                        delete action.tempData;
                        this.needsRedraw = true;
                        Component.setChange();
                    }
                },
                mouseEntered: function() {
                    pjs.cursor(pjs.CROSS);
                },
                mouseLeft: function() {
                    pjs.cursor(pjs.ARROW);
                },
                addOnLayerChange: function(callback) {
                    if(this.onLayerChange) {
                        var callback2 = this.onLayerChange;
                        this.onLayerChange = function() {
                            callback();
                            callback2();
                        };
                    } else {
                        this.onLayerChange = callback;
                    }
                },
                addLayer: function(name) {
                    var layer = Object.assign(Object.create(_layerProto),{
                        name: name || "Layer " + this.layers.length,
                        index: ++this.currentLayer,
                        canvas: this,
                        graphics: Graphics.create(this.imageWidth, this.imageHeight)
                    });
                    this.layers.splice(layer.index, 0, layer);
                    this.addAction({
                        action: Action.ADD_LAYER,
                        name: layer.name,
                        index: layer.index
                    });
                    for(var i = layer.index + 1; i < this.layers.length; i++) {
                        this.layers[i].index = i;
                    }
                    if(this.onLayerChange)
                        { this.onLayerChange(); }
                },
                addAction: function(action, inProgress) {
                    if(!this.actionInProgress && !this.freezeActions) {
                        this.actions.splice(++this.currentAction);
                        this.actions.push(action);
                        this.actionInProgress = !!inProgress;
                    }
                }
            });
            
            _tools = {
                0: "brush",
                BRUSH: 0,
                1: "eraser",
                ERASER: 1
            };
            _layerProto = {
                isVisible: true,
                setVisible: function(visible) {
                    if(visible !== this.isVisible) {
                        this.isVisible = visible;
                        this.canvas.addAction({
                            action: visible ? Action.SHOW_LAYER : Action.HIDE_LAYER,
                            index: this.index
                        });
                        this.canvas.needsRedraw = true;
                        Component.setChange();
                        if(this.onLayerChange)
                            { this.onLayerChange(); }
                    }
                },
                isSelected: function() {
                    return this.canvas.currentLayer === this.index;
                },
                select: function() {
                    if(!this.isSelected()) {
                        this.canvas.currentLayer = this.index;
                        this.canvas.addAction({
                            action: Action.SELECT_LAYER,
                            index: this.index
                        });
                        if(this.canvas.onLayerChange)
                            { this.canvas.onLayerChange(); }
                    }
                },
                swap: function(index) {
                    var canvas = this.canvas;
                    var that = canvas.layers[index];
                    if( !that || that === this )
                        { return false; }
                    that.index = this.index;
                    this.index = index;
                    canvas.layers[that.index] = that;
                    canvas.layers[this.index] = this;
                    var currLayer = canvas.currentLayer;
                    if(currLayer === this.index || currLayer === that.index)
                        { canvas.currentLayer ^= this.index ^ that.index; }
                    canvas.addAction({
                        action: Action.SWAP_LAYERS,
                        index1: that.index,
                        index2: this.index
                    });
                    canvas.needsRedraw = true;
                    if(canvas.onLayerChange)
                        { canvas.onLayerChange(); }
                    return true;
                },
                remove: function() {
                    if(this.canvas.currentLayer >= this.index)
                        { this.canvas.currentLayer--; }
                    var layers = this.canvas.layers;
                    layers.splice(this.index, 1);
                    if(layers.length && this.canvas.currentLayer === -1)
                        { this.canvas.currentLayer = 0; }
                    for(var i = this.index; i < layers.length; i++) {
                        layers[i].index = i;
                    }
                    this.canvas.addAction({
                        action: Action.REMOVE_LAYER,
                        index: this.index
                    });
                    this.index = -1;
                    this.canvas.needsRedraw = true;
                    if(this.canvas.onLayerChange)
                        { this.canvas.onLayerChange(); }
                }
            };
            
            _initOrUpdate = function(canvas) {
                var needsInit = !canvas.bounds;

                var fs = canvas.isFullscreen();
                var margin = fs ? 0 : 4;
                var w = canvas.width;
                var h = canvas.height;
                var imgW = canvas.imageWidth;
                var imgH = canvas.imageHeight;
                var scale = pjs.min((w - 2*margin) / imgW, (h - 2*margin) / imgH);

                canvas.graphics.beginDraw();

                if(needsInit) {
                    canvas.actions = [];
                    canvas.layers = [];
                    canvas.freezeActions = true;
                    canvas.addLayer('Background');
                    canvas.freezeActions = false;
                } else {
                    canvas.graphics.popMatrix();
                }

                canvas.graphics.pushMatrix();
                canvas.graphics.translate(w/2,h/2);
                canvas.graphics.scale(scale,scale);
                canvas.graphics.translate(-imgW/2,-imgH/2);
                canvas.graphics.endDraw();
                
                canvas.scale = scale;
                canvas.bounds = {
                    x: (w-scale*imgW)/2,
                    y: (h-scale*imgH)/2,
                    width:  scale*imgW,
                    height: scale*imgH
                };
            };
            _toUserCoords = function(canvas, x, y) {
                var bounds = canvas.bounds;
                return {
                    x: pjs.round((x - bounds.x)/canvas.scale),
                    y: pjs.round((y - bounds.y)/canvas.scale)
                };
            };
            _drawAction = function(graphics, action) {
                var tempData, points, rOut, rIn, g, mult,
                    minX, minY, maxX, maxY, data, x, y, i;
                if( !(tempData = action.tempData) ) {
                    return;
                }
                g = tempData.graphics;
                switch(action.action) {
                    case Action.DRAW:
                    case Action.ERASE:
                        points = action.points;
                        if(2*tempData.drawnPts === points.length)
                            { break; }
                        rOut = 0.5 * (action.size + action.blur);
                        rIn  = 0.5 * (action.size - action.blur);
                        minX = g.width;
                        minY = g.height;
                        maxX = maxY = 0;
                        i = pjs.max(0, 2*tempData.drawnPts - 2);
                        for(; i < points.length; i += 2) {
                            minX = pjs.min(minX, points[i]   - rOut);
                            minY = pjs.min(minY, points[i+1] - rOut);
                            maxX = pjs.max(maxX, points[i]   + rOut);
                            maxY = pjs.max(maxY, points[i+1] + rOut);
                        }
                        minX = pjs.max(minX, 0);
                        minY = pjs.max(minY, 0);
                        maxX = pjs.min(maxX, g.width);
                        maxY = pjs.min(maxY, g.height);
                        if(minX >= maxX || minY >= maxY) { break; }
                        g.beginDraw();
                        g.loadPixels();
                        data = g.imageData.data;
                        for(y = minY | 0; y < maxY; y++) {
                            for(x = minX | 0; x < maxX; x++) {
                                var dist = _dist(x, y, points);
                                if(dist < rOut) {
                                    var alpha = 255;
                                    if(dist > rIn) {
                                        mult = (rOut - dist)/action.blur;
                                        alpha *= mult * mult;
                                    }
                                    var color;
                                    if(action.action === Action.DRAW) {
                                        color = action.color & 0xffffff;
                                        color |= alpha << 24;
                                    } else if(action.action === Action.ERASE) {
                                        color = 0xffffff | ((255 - alpha) << 24);
                                    }
                                    i = (g.width * y + x) << 2;
                                    data[i  ] = pjs.red  (color);
                                    data[i+1] = pjs.green(color);
                                    data[i+2] = pjs.blue (color);
                                    data[i+3] = pjs.alpha(color);
                                }
                            }
                        }
                        g.updatePixels();
                        g.endDraw();
                        tempData.drawnPts = points.length / 2;
                        break;
                }
                switch(action.action) {
                    case Action.DRAW:
                        Graphics.image(graphics, g, 0, 0, 0, 0, action.alpha);
                        break;
                    case Action.ERASE:
                        Graphics.mask(graphics, g, 0, 0, 0, 0, action.alpha);
                        break;
                }
            };
            _dist = function(x, y, points) {
                var dist = Infinity;
                var v1, v2, v1Len, v2Len;
                for(var i = 0; i < points.length; i += 2) {
                    v2 = v1;
                    v2Len = v1Len;
                    v1 = [points[i]-x, points[i+1]-y];
                    v1Len = Vectors.length(v1);
                    dist = pjs.min(dist, v1Len);
                    
                    if(v2 && !Vectors.equal(v1, v2)) {
                        var v3 = Vectors.subtract(v2, v1);
                        if(Vectors.dot(v1, v3) < 0 && Vectors.dot(v2, v3) > 0) {
                            v3 = Vectors.subtract(v2, Vectors.proj(v2, v3));
                            dist = pjs.min(dist, Vectors.length(v3));
                        }
                    }
                }
                return dist;
            };
            _playback = function(count) {
                this.freezeActions = true;
                var action = this.actions[++this.currentAction];
                switch(action.action) {
                    case Action.ADD_LAYER:
                        this.addLayer(action.name);
                        break;
                    case Action.SELECT_LAYER:
                        this.layers[action.index].select();
                        break;
                    case Action.SHOW_LAYER:
                        this.layers[action.index].setVisible(true);
                        break;
                    case Action.HIDE_LAYER:
                        this.layers[action.index].setVisible(false);
                        break;
                    case Action.SWAP_LAYERS:
                        this.layers[action.index1].swap(action.index2);
                        break;
                    case Action.REMOVE_LAYER:
                        this.layers[action.index].remove();
                        break;
                    case Action.DRAW:
                    case Action.ERASE:
                        var g = this.layers[this.currentLayer].graphics;
                        var w = this.imageWidth;
                        var h = this.imageHeight;
                        var bg = action.action === Action.DRAW ? 0 : -1;
                        action.tempData = {
                            drawnPts: 0,
                            graphics: Graphics.create(w, h, bg)
                        };
                        g.beginDraw();
                        _drawAction(g, action);
                        g.endDraw();
                        delete action.tempData;
                        this.needsRedraw = true;
                        Component.setChange();
                        break;
                    default:
                        pjs.println('Error: Unrecognized action during playback: ' + Action.getLabel(action.action));
                        break;
                }
                this.freezeActions = false;
                
                return this.currentAction === this.playStop;
            };
            
            return Canvas;
        })();
        var Scroller = (function() {
            
            var _COLOR_ACTIVE = pjs.color(157, 232, 162);
            
            var _toScrollbarCoord, _toContentCoord;
            
            var Scroller = function(config) {
                config = config || {};
                Component.call(this, config);
                if(config.barWidth)
                    { this.barWidth = config.barWidth; }
                this.top = 0;
                this.bottom = this.height;
                this.update = this.update.bind(this);
                this.upButton = new Button({
                    parent: this,
                    x: this.width - this.barWidth,
                    width: this.barWidth,
                    height: this.barWidth,
                    icon: ButtonIcons.up,
                    iconActive: ButtonIcons.upActive,
                    backgroundActive: _COLOR_ACTIVE,
                    onToggle: function(active) {
                        if(active)
                            { this.parent.scroll(1); }
                    }
                });
                this.downButton = new Button({
                    parent: this,
                    x: this.width - this.barWidth,
                    y: this.height - this.barWidth,
                    width: this.barWidth,
                    height: this.barWidth,
                    icon: ButtonIcons.down,
                    iconActive: ButtonIcons.downActive,
                    backgroundActive: _COLOR_ACTIVE,
                    onToggle: function(active) {
                        if(active)
                            { this.parent.scroll(-1); }
                    }
                });
                this.barButton = new Button({
                    parent: this,
                    x: this.width - this.barWidth,
                    y: this.barWidth,
                    width: this.barWidth,
                    height: this.height - 2*this.barWidth,
                    icon: ButtonIcons.none,
                    backgroundActive: _COLOR_ACTIVE,
                    onToggle: function(active) {
                        this.pressedY = active ?
                                pjs.mouseY - this.globalY :
                                undefined;
                    },
                    mouseDragged: function(e) {
                        this.parent.scrollTo(this.y + e.y - this.pressedY);
                    }
                });
            };
            Scroller.prototype = Object.assign(Object.create(Component.prototype), {
                barWidth: 20,
                background: pjs.color(63, 69, 87),
                draw: function(g) {
                    g.noStroke();
                    g.fill(this.background);
                    g.rect(this.width-this.barWidth, 0, this.barWidth, this.height);
                    this.needsRedraw = false;
                },
                addChild: function(comp, config) {
                    var isContent = this.children.length >= 3;
                    if(isContent) {
                        if(!config.y)
                            { config.y = 0; }
                        if(!config.width)
                            { config.width = this.width - this.barWidth; }
                        if(!config.height)
                            { config.height = this.height; }
                        if(config.cropToParent === undefined)
                            { config.cropToParent = true; }
                        config.onResize = this.update;
                    }
                    Component.prototype.addChild.call(this, comp, config);
                    if(isContent) {
                        this.children.pop();
                        this.children.splice(this.children.length - 3, 0, comp);
                        this.top = pjs.min(this.top, config.y);
                        this.bottom = pjs.max(this.bottom, config.y + config.height);
                        this.updateScrollbar();
                    }
                },
                scroll: function(amount) {
                    var bar = this.barButton;
                    this.scrollTo(bar.y - 0.18*amount*bar.height);
                    return false;
                },
                scrollTo: function(y) {
                    var bar = this.barButton;
                    y = pjs.constrain(y,
                            this.barWidth,
                            this.height - this.barWidth - bar.height);
                    if(y !== bar.y) {
                        bar.setLocation(bar.x, y);
                        y = _toContentCoord(this, y);
                        this.top = 0;
                        this.bottom = this.height;
                        for(var i = 0; i < this.children.length - 3; i++) {
                            var comp = this.children[i];
                            comp.setLocation(comp.x, comp.y-y);
                            this.top = pjs.min(this.top, comp.y);
                            this.bottom = pjs.max(this.bottom, comp.y + comp.height);
                        }
                    }
                },
                update: function() {
                    var top = 0;
                    var bottom = 0;
                    var scroll = 0;
                    for(var i = 0; i < this.children.length - 3; i++) {
                        var comp = this.children[i];
                        top = pjs.min(top, comp.y);
                        bottom = pjs.max(bottom, comp.y + comp.height);
                    }
                    if(top < 0 && bottom < this.height) {
                        scroll = pjs.min(-top, this.height - bottom);
                        top += scroll;
                        bottom += scroll;
                        for(var i = 0; i < this.children.length - 3; i++) {
                            var comp = this.children[i];
                            comp.setLocation(comp.x, comp.y + scroll);
                        }
                    }
                    bottom = pjs.max(bottom, this.height);
                    if(top !== this.top || bottom !== this.bottom || scroll !== 0) {
                        this.top = top;
                        this.bottom = bottom;
                        this.updateScrollbar();
                        Component.setChange();
                    }
                },
                updateScrollbar: function() {
                    var barY = _toScrollbarCoord(this, 0);
                    var barH = _toScrollbarCoord(this, this.height) - barY;
                    var bar = this.barButton;
                    bar.setLocation(bar.x, barY);
                    bar.resize(bar.width, barH);
                },
                mousePressed: function(e) {
                    if(pjs.mouseButton === pjs.LEFT) {
                        this.scrollTo(e.y - 0.5*this.barButton.height);
                    }
                }
            });
            Scroller.prototype.mouseScrolled = Scroller.prototype.scroll;
            
            _toScrollbarCoord = function(scroller, y) {
                var totHeight = scroller.bottom - scroller.top;
                var barHeight = scroller.height - 2*scroller.barWidth;
                return scroller.barWidth + barHeight/totHeight*(y - scroller.top);
            };
            _toContentCoord = function(scroller, y) {
                var totHeight = scroller.bottom - scroller.top;
                var barHeight = scroller.height - 2*scroller.barWidth;
                return scroller.top + totHeight/barHeight*(y - scroller.barWidth);
            };
            
            return Scroller;
        })();
        var LayerDetail = (function() {
            
            var _HEIGHT = 53;
            
            var _init, _select, _toggleShow, _moveUp, _moveDown, _remove;
            var LayerDetail = function(config) {
                config = config || {};
                if(!config.height)
                    { config.height = _HEIGHT; }
                Component.call(this, config);
                if(config.layer)
                    { this.layer = config.layer; }
                _init(this);
            };
            LayerDetail.prototype = Object.assign(Object.create(Component.prototype), {
                height: _HEIGHT,
                background: pjs.color(119, 124, 125),
                backgroundActive: pjs.color(43, 76, 84),
                draw: function(g) {
                    var selected = this.layer.isSelected();
                    g.fill(selected ? this.backgroundActive : this.background);
                    g.rect(0,0,g.width-1,g.height-1, 3);
                    g.fill(255);
                    g.text(this.layer.name, 2, 14);
                    this.needsRedraw = false;
                }
            });
            _init = function(comp) {
                var canvas = comp.parent.canvas;
                var btnsX = 2;
                var btnsY = comp.height - 36;
                comp.selectButton = new Button({
                    parent: comp,
                    x: btnsX,
                    y: btnsY,
                    clickBehavior: Button.ACTIVATE,
                    icon: ButtonIcons.select,
                    iconActive: ButtonIcons.selectActive,
                    isActive: comp.layer.isSelected(),
                    buttonGroup: comp.parent.selectButtons,
                    onToggle: _select
                });
                comp.showButton = new Button({
                    parent: comp,
                    x: btnsX + 35,
                    y: btnsY,
                    clickBehavior: Button.TOGGLE,
                    icon: ButtonIcons.show,
                    iconActive: ButtonIcons.showActive,
                    isActive: comp.layer.isVisible,
                    onToggle: _toggleShow
                });
                comp.upButton = new Button({
                    parent: comp,
                    x: btnsX + 70,
                    y: btnsY,
                    icon: ButtonIcons.up,
                    iconActive: ButtonIcons.upActive,
                    isEnabled: comp.layer.index !== canvas.layers.length - 1,
                    onToggle: _moveUp
                });
                comp.downButton = new Button({
                    parent: comp,
                    x: btnsX + 105,
                    y: btnsY,
                    icon: ButtonIcons.down,
                    iconActive: ButtonIcons.downActive,
                    isEnabled: comp.layer.index !== 0,
                    onToggle: _moveDown
                });
                comp.removeButton = new Button({
                    parent: comp,
                    x: btnsX + 140,
                    y: btnsY,
                    icon: ButtonIcons.remove,
                    onToggle: _remove
                });
            };
            _select = function(active) {
                if(active)
                    { this.parent.layer.select(); }
            };
            _toggleShow = function(active) {
                this.parent.layer.setVisible(active);
            };
            _moveUp = function(active) {
                if(active) {
                    var layer = this.parent.layer;
                    layer.swap(layer.index + 1);
                }
            };
            _moveDown = function(active) {
                if(active) {
                    var layer = this.parent.layer;
                    layer.swap(layer.index - 1);
                }
            };
            _remove = function(active) {
                if(active) {
                    var layer = this.parent.layer;
                    layer.remove();
                    this.setActive(false);
                }
            };
            return LayerDetail;
        })();
        var LayerList = (function() {
            var _init, _calculateY, _updateArrangement;
            var LayerList = function(config) {
                config = config || {};
                Component.call(this, config);
                if(config.canvas)
                    { this.canvas = config.canvas; }
                _init(this);
            };
            LayerList.prototype = Object.assign(Object.create(Component.prototype), {
                selected: -1,
                needsUpdate: function() {
                    var canvas = this.canvas;
                    var count = this.children.length;
                    if(count !== canvas.layers.length )
                        { return true; }
                    if(canvas.currentLayer !== this.selected)
                        { return true; }
                    for(var i = 0; i < count; i++) {
                        if(this.children[i].layer !== canvas.layers[i])
                            { return true; }
                    }
                    return false;
                },
                update: function() {
                    if( !this.needsUpdate() )
                        { return; }
                    var layers = this.canvas.layers;
                    var countOld = this.children.length;
                    var countNew = layers.length;
                    var selectedOld = this.selected;
                    var selectedNew = this.canvas.currentLayer;
                    var i = 0;
                    for(; i < countOld && i < countNew; i++) {
                        var layerComp = this.children[i];
                        if(layerComp.layer !== layers[i]) {
                            layerComp.layer = layers[i];
                            layerComp.needsRedraw = true;
                        }
                    }
                    while(i < countOld) {
                        this.removeChild(--countOld);
                    }
                    while(i < countNew) {
                        new LayerDetail({
                            parent: this,
                            layer: layers[i++]
                        });
                    }
                    if(selectedOld !== selectedNew) {
                        if(selectedNew >= 0) {
                            this.children[selectedNew].selectButton.setActive(true);
                            this.children[selectedNew].needsRedraw = true;
                        }
                        if(selectedOld >= 0 && selectedOld < countNew) {
                            this.children[selectedOld].needsRedraw = true;
                        }
                        this.selected = selectedNew;
                    }
                    _updateArrangement(this);
                },
                addChild: function(comp, config) {
                    var index = config.layer.index;
                    config.y = _calculateY(this.children.length - index);
                    Component.prototype.addChild.call(this, comp, config);
                    if(index !== this.children.length - 1) {
                        this.children.pop();
                        this.children.splice(index, 0, comp);
                    }
                },
                draw: function(g) {
                    this.needsRedraw = false;
                }
            });
            _init = function(comp) {
                comp.selectButtons = [];
                var layers = comp.canvas.layers;
                for(var i = 0; i < layers.length; i++) {
                    new LayerDetail({
                        parent: comp,
                        layer: layers[i]
                    });
                }
                comp.canvas.addOnLayerChange(comp.update.bind(comp));
            };
            _calculateY = function(reverseIndex) {
                return reverseIndex * (LayerDetail.prototype.height + 1);
            };
            _updateArrangement = function(comp) {
                var length = comp.children.length;
                var selected = comp.canvas.currentLayer;
                for(var i = 0; i < length; i++) {
                    var child = comp.children[i];
                    var y = _calculateY(length - i - 1);
                    child.setLocation(child.x, y);
                    child.upButton.setEnabled(i !== length - 1);
                    child.downButton.setEnabled(i !== 0);
                }
                var height = _calculateY(comp.children.length) - 1;
                comp.resize(comp.width, height);
            };
            return LayerList;
        })();

        var IO = (function() {

            var _DEFAULT_VAR_NAME = "save";
            var _CHARS ="0123456789ABCDEFGHIJKLMNOPQRSTUV"+
                        "WXYZabcdefghijklmnopqrstuvwxyz_Ÿ"+
                        "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖŒØÙÚÛÜÝÞß"+
                        "àáâãäåæçèéêëìíîïðñòóôõöœøùúûüýþÿ";

            var _map, _charToCode, _codeToChar, _read, _write, _stripTrailingZeros;

            var IO = function(data) {
                data = data ? _stripTrailingZeros("" + data) : "";

                if( data ) {
                    var char = data.charAt(data.length - 1);
                    var last = _charToCode(char);
                    var i = 6;
                    while( !(last & (1 << i)) ) {
                        i--;
                    }
                    this.data = data.substring(0, data.length - 1);
                    this.length = 7 * this.data.length + i;
                    if((last &= ~(1 << i))) {
                        this.data += _codeToChar(last);
                    }
                    this.data = _stripTrailingZeros(this.data);
                }
            };
            IO.prototype = {
                data: "",
                length: 0,
                index: 0,
                canRead: function(numBits) {
                    numBits = numBits === undefined ? 1 : numBits | 0;
                    if(numBits < 0 || numBits > 32) {
                        return false;
                    }
                    return this.index + numBits <= this.length;
                },
                read: function(numBits) {
                    numBits = numBits === undefined ? 1 : numBits | 0;
                    if(!this.canRead(numBits)) {
                        return false;
                    }
                    var value = _read(this.data, this.index, numBits);
                    this.index += numBits;
                    return value;
                },
                write: function(numBits, value) {
                    if(numBits === undefined) {
                        return false;
                    }
                    numBits |= 0;
                    if(numBits < 0 || numBits > 32) {
                        return false;
                    }
                    value &= numBits < 32 ? (1 << numBits) - 1 : -1;

                    this.data = _write(this.data, this.length, value);
                    this.length += numBits;
                    if(numBits) {
                        this.cache = undefined;
                    }
                    return true;
                },
                resetRead: function() {
                    this.index = 0;
                },
                clear: function() {
                    this.data = "";
                    this.index = 0;
                    this.length = 0;
                },
                toString: function() {
                    if(!this.cache) {
                        this.cache = _write(this.data, this.length, 1);
                    }
                    return this.cache;
                },
                print: function(varName) {
                    varName = varName ? "" + varName : _DEFAULT_VAR_NAME;
                    pjs.println('var ' + varName + ' = "' + this + '";');
                }
            };

            _charToCode = function(char) {
                if(!_map) {
                    _map = {};
                    for(var i = 0; i < _CHARS.length; i++) {
                        _map[_CHARS.charAt(i)] = i;
                    }
                }
                return _map[char] || 0;
            };
            _codeToChar = function(code) {
                return _CHARS.charAt(code & 127);
            };
            _read = function(data, index, numBits) {
                if(!numBits) {
                    return 0;
                }

                var from = (index / 7) | 0;
                index %= 7;
                var to = from + ((index + numBits + 6) / 7) | 0;
                if( from >= data.length ) {
                    return 0;
                }
                var val = 0;
                for(var i = to - 1; i >= from; i--) {
                    val *= 128;
                    val += _charToCode(data.charAt(i));
                }
                val = (val / (1 << index)) & (2 * (1 << (numBits-1)) - 1);
                return val;
            };
            _write = function(data, index, val) {
                if(!val) {
                    return data;
                }
                val += val < 0 ? 0x100000000 : 0;

                var from = (index / 7) | 0;
                index %= 7;
                val = val * (1 << index) + _read(data, 7 * from, index);

                var i, append = "";
                for(i = from; val; i++) {
                    append += _codeToChar(val & 127);
                    val = (val / 128) | 0;
                }
                if(append) {
                    var zero = _codeToChar(0);
                    for(i = from - data.length; i > 0; i--) {
                        append = zero + append;
                    }
                }
                return data.substring(0, from) + append;
            };
            _stripTrailingZeros = function(data) {
                if(data === "")
                    { return ""; }
                var end = data.length;
                while(!_charToCode(data.charAt(end - 1))) {
                    end--;
                }
                return data.substring(0, end);
            };

            return IO;
        })();
        var Worker = (function() {
            var Worker = function() {
                this.tasks = {};
                this.index = 0;
                this.length = 0;
            };
            Worker.prototype = {
                tasks: {},
                index: 0,
                length: 0,
                addRepeatedTask: function(callback) {
                    this.tasks[this.length++] = {
                        callback: callback,
                        repeats: true,
                        calls: 0
                    };
                },
                addSingleTask: function(callback) {
                    this.tasks[this.length++] = {
                        callback: callback,
                        repeats: false
                    };
                },
                hasPendingTasks: function() {
                    return !!(this.tasks[this.index]);
                },
                work: function(millis) {
                    millis = millis || 50;
                    var start = pjs.millis();
                    while(this.hasPendingTasks()) {
                        if(pjs.millis() > start + millis)
                            { return false; }
                        var task = this.tasks[this.index];
                        var del = true;
                        if(task.repeats)
                            { del = task.callback(task.calls++); }
                        else
                            { task.callback(); }
                        if(del)
                            { delete this.tasks[this.index++]; }
                    }
                    return true;
                }
            };

            Worker.getWorker = function() {
                return Worker.prototype;
            };
            return Worker;
        })();

        Action = (function() {
            var _meta = [];

            var Action = {
                ADD_LAYER: 0,
                REMOVE_LAYER: 1,
                SELECT_LAYER: 2,
                SHOW_LAYER: 3,
                HIDE_LAYER: 4,
                SWAP_LAYERS: 5,
                DRAW: 6,
                ERASE: 7,
                getLabel: function(key) {
                    var meta = _meta[key];
                    return meta ? meta.label : undefined;
                },
                getSchema: function(key) {
                    var meta = _meta[key];
                    return meta ? meta.schema : undefined;
                }
            };

            _meta[Action.ADD_LAYER] = {label: "Add layer"};
            _meta[Action.REMOVE_LAYER] = {label: "Remove layer"};
            _meta[Action.SELECT_LAYER] = {label: "Select layer"};
            _meta[Action.SHOW_LAYER] = {label: "Show layer"};
            _meta[Action.HIDE_LAYER] = {label: "Hide layer"};
            _meta[Action.SWAP_LAYERS] = {label: "Swap layers"};
            _meta[Action.DRAW] = {label: "Draw"};
            _meta[Action.ERASE] = {label: "Erase"};

            _meta[Action.ADD_LAYER].schema = [
                {key: 'name', type: 'string'},
                {key: 'index', type: 'number', bits: 5}
            ];
            _meta[Action.REMOVE_LAYER].schema = (
            _meta[Action.SELECT_LAYER].schema = (
            _meta[Action.SHOW_LAYER].schema = (
            _meta[Action.HIDE_LAYER].schema = [
                {key: 'index', type: 'number', bits: 5}
            ])));
            _meta[Action.SWAP_LAYERS].schema = [
                {key: 'index1', type: 'number', bits: 5},
                {key: 'index2', type: 'number', bits: 5}
            ];
            _meta[Action.DRAW].schema = [
                {key: 'color', type: 'color'},
                {key: 'alpha', type: 'number', bits: 8},
                {key: 'size', type: 'number', bits: 7},
                {key: 'blur', type: 'number', bits: 7},
                {key: 'points', type: 'array', bits: 24,
                    content: {type: 'number', bits: 10, offset: -212}
                }
            ];
            _meta[Action.ERASE].schema = [
                {key: 'alpha', type: 'number', bits: 8},
                {key: 'size', type: 'number', bits: 7},
                {key: 'blur', type: 'number', bits: 7},
                {key: 'points', type: 'array', bits: 24,
                    content: {type: 'number', bits: 10, offset: -212}
                }
            ];

            return Action;
        })();
        Vectors = {
            length: function(v) {
                return pjs.sqrt(v[0]*v[0] + v[1]*v[1]);
            },
            dot: function(v1, v2) {
                return v1[0]*v2[0] + v1[1]*v2[1];
            },
            proj: function(v1, v2) {
                var scale = Vectors.dot(v1,v2) / Vectors.dot(v2,v2);
                return [scale*v2[0], scale*v2[1]];
            },
            equal: function(v1, v2) {
                return v1[0] === v2[0] && v1[1] === v2[1];
            },
            subtract: function(v1, v2) {
                return [v1[0]-v2[0], v1[1]-v2[1]];
            }
        };
        Graphics = (function() {
            var _mix;
            var Graphics = {
                create: function(w, h, bg) {
                    var g = pjs.createGraphics(w, h, pjs.P2D);
                    g.beginDraw();
                    bg |= 0;
                    g.background(
                        pjs.red(bg), pjs.green(bg), pjs.blue(bg), pjs.alpha(bg)
                    );
                    g.endDraw();
                    return g;
                },
                negate: function(g) {
                    g.loadPixels();
                    var data = g.imageData.data;
                    for(var i = 0; i < data.length; i++) {
                        data[i] = 255 - data[i];
                    }
                    g.updatePixels();
                },
                image: function(g1, g2, x, y, w, h, opacity) {
                    return _mix(g1, g2, x, y, w, h, opacity, 'image');
                },
                mask: function(g1, g2, x, y, w, h, opacity) {
                    return _mix(g1, g2, x, y, w, h, opacity, 'mask');
                },
                drawBezier: function(g, data) {
                    g.beginShape();
                    g.vertex(data[0], data[1]);
                    for(var i = 2; i < data.length; i += 6) {
                        g.bezierVertex.apply(g, data.slice(i, i+6));
                    }
                    g.endShape();
                }
            };
            
            _mix = function(g1, g2, x, y, w, h, opacity, type) {
                x |= 0;
                y |= 0;
                w = w || g2.width;
                h = h || g2.height;
                if(opacity === undefined)
                    { opacity = 255; }
                opacity /= 255;
                g1.loadPixels();
                g2.loadPixels();
                var data1 = g1.imageData.data;
                var data2 = g2.imageData.data;
                for ( var y1 = y, y2 = 0;
                      y1 < g1.height && y2 < g2.height;
                      y1++, y2 = ((y1 - y) * g2.height/h) | 0 ) {
                    for ( var x1 = x, x2 = 0;
                          x1 < g1.width && x2 < g2.width;
                          x1++, x2 = ((x1 - x) * g2.width/w) | 0 ) {
                        var i1 = (y1 * g1.width + x1) << 2;
                        var i2 = (y2 * g2.width + x2) << 2;
                        var red1 = data1[i1  ], red2 = data2[i2  ],
                            grn1 = data1[i1+1], grn2 = data2[i2+1],
                            blu1 = data1[i1+2], blu2 = data2[i2+2],
                            alp1 = data1[i1+3], alp2 = data2[i2+3];
                        switch(type) {
                        case 'image':
                            alp1 += (1 - alp1/255) * (alp2 *= opacity);
                            data1[i1  ] = ((alp1-alp2)*red1 + alp2*red2)/alp1 || 0;
                            data1[i1+1] = ((alp1-alp2)*grn1 + alp2*grn2)/alp1 || 0;
                            data1[i1+2] = ((alp1-alp2)*blu1 + alp2*blu2)/alp1 || 0;
                            data1[i1+3] = alp1;
                            break;
                        case 'mask':
                            if(alp2 > 0) {
                                data1[i1  ] *= 1 - (1 - red2/255)*opacity;
                                data1[i1+1] *= 1 - (1 - grn2/255)*opacity;
                                data1[i1+2] *= 1 - (1 - blu2/255)*opacity;
                            }
                            data1[i1+3] *= 1 - (1 - alp2/255)*opacity;
                            break;
                        }
                    }
                }
                g1.updatePixels();
            };
            return Graphics;
        })();
        ButtonIcons = (function() {
            var _color;
            
            var ButtonIcons = {
                fromImage: function(image) {
                    return Button.createIcon(function(g) {
                        g.image(image, 0, 0, g.width, g.height);
                    });
                }
            };
            
            var _drawBrushIcon = function(g) {
                var data;
                g.scale(g.width/100, g.height/100);
                g.noStroke();
                g.fill(_color);
                data = [12,88,26,85,22,85,28,77,37,67,
                        54,73,43,88,37,96,26,91,12,88];
                Graphics.drawBezier(g, data);
                data = [44,65,43,45,81, 3,84, 6,86, 8,
                        66,66,51,71,50,69,47,66,44,65];
                Graphics.drawBezier(g, data);
            };
            var _drawEraserIcon = function(g) {
                g.scale(g.width/100, g.height/100);
                g.translate(-5,5);
                g.noFill();
                g.stroke(_color);
                g.strokeWeight(8);
                g.line(43,84,80,84);
                g.rotate(0.25*pjs.PI);
                g.rect(50, -40, 40, 70, 5);
                g.noStroke();
                g.fill(_color);
                g.rect(50, -40, 40, 35, 5);
            };
            var _drawStrokeIcon = function(g) {
                g.scale(g.width/100, g.height/100);
                g.noFill();
                g.stroke(_color);
                g.strokeWeight(15);
                g.point(87, 30);
                g.filter(pjs.BLUR, 1.5);
                g.point(48, 23);
                g.filter(pjs.BLUR, 1);
                g.point(16, 20);
                var curveData = [10,0,30,-20,70,20,90,0];
                var curveWeights = [3, 8, 13];
                var moveY = [48, 16, 20];
                for(var i = 0; i < 3; i++) {
                    g.translate(0, moveY[i]);
                    g.strokeWeight(curveWeights[i]);
                    Graphics.drawBezier(g, curveData);
                }
            };
            var _drawLayersIcon = function(g) {
                g.scale(g.width/100, g.height/100);
                g.translate(50, 50);
                var alpha = 144;
                g.fill((_color & 0xffffff) | (alpha << 24));
                g.stroke(_color);
                g.strokeWeight(3);
                var q = {w: 42, h: 15, s: 25, d: 22};
                g.quad( -q.w+q.s, -q.h-q.d, +q.w, -q.h-q.d,
                        +q.w-q.s, +q.h-q.d, -q.w, +q.h-q.d);
                g.quad( -q.w+q.s, -q.h    , +q.w, -q.h    ,
                        +q.w-q.s, +q.h    , -q.w, +q.h    );
                g.quad( -q.w+q.s, -q.h+q.d, +q.w, -q.h+q.d,
                        +q.w-q.s, +q.h+q.d, -q.w, +q.h+q.d);
            };
            var _drawSelectIcon = function(g) {
                var data = [
                    63,99,68,86,87,81,96,86,75,34,78,49,74,44,70,
                    41,67,40,65,42,56,38,57,38,51,41,40,21,37,20,
                    31,18,28,17,26,20,27,24,27,28,35,37,40,50,42,
                    57,42,59,43,63,38,64,35,63,31,60,27,57,23,60,
                    26,66,30,74,34,77,50,84,55,88,60,93,63,99
                ];
                g.scale(g.width/100, g.height/100);
                g.noStroke();
                g.fill(_color);
                Graphics.drawBezier(g, data);
                g.noFill();
                g.stroke(_color);
                g.strokeWeight(6);
                g.rect(15,6,30,30,5);
            };
            var _drawShowIcon = function(g) {
                var w = 45; // Eye width
                var h = 35; // Eye height
                var c = 20; // Eye curve
                var r = 14; // Pupil radius
                var y = 5;  // Pupil position y
                g.scale(g.width/100, g.height/100);
                g.translate(50,50);
                g.noFill();
                g.stroke(_color);
                g.strokeWeight(10);
                g.beginShape();
                g.vertex(-w,0);
                g.bezierVertex(-c,-h,c,-h,w,0);
                g.endShape();
                g.beginShape();
                g.vertex(-w,0);
                g.bezierVertex(-c,h,c,h,w,0);
                g.endShape();
                g.strokeWeight(14);
                g.ellipse(0, -y, 2*r, 2*r);
            };
            var _drawUpIcon = function(g) {
                g.scale(g.width/100, g.height/100);
                g.fill(_color);
                g.beginShape();
                g.translate(50,50);
                var w = 15;
                var t = 40;
                var b = 40;
                var s = 40;
                var points = [0,-t,-s,s-t,-w,s-t,-w,b,w,b,w,s-t,s,s-t];
                g.beginShape();
                for(var i = 0; i < points.length; i += 2) {
                    g.vertex(points[i], points[i+1]);
                }
                g.endShape();
            };
            var _drawDownIcon = function(g) {
                g.translate(0,g.height);
                g.scale(1,-1);
                _drawUpIcon(g);
            };
            var _drawSaveIcon = function(g) {
                g.scale(g.width/100, g.height/100);
                g.translate(50, 50);
                g.strokeWeight(20);
                g.strokeJoin(pjs.ROUND);
                g.stroke(_color);
                g.fill(_color);
                g.rectMode(pjs.CENTER);
                g.rect(0, 0, 70, 70);
                
                var mask = Graphics.create(g.width, g.height);
                mask.beginDraw();
                mask.scale(g.width/100, g.height/100);
                mask.translate(50, 50);
                mask.stroke(255);
                mask.strokeWeight(5);
                mask.strokeJoin(pjs.ROUND);
                mask.fill(255);
                mask.rectMode(pjs.CENTER);
                mask.rect(-10, -35, 45, 30);
                mask.rect(0, 20, 55, 30);
                mask.rotate(0.25 * pjs.PI);
                mask.rect(0, -70, 100, 40);
                Graphics.negate(mask);
                Graphics.mask(g, mask);
                mask.endDraw();
                
                g.noStroke();
                g.rect(5, -33, 8, 20);
            };
            var _drawFullscreenIcon = function(g) {
                var o = 43; // Outer
                var i = 33; // Inner
                var s = 10; // Space
                g.scale(g.width/100, g.height/100);
                g.translate(50, 50);
                g.noStroke();
                g.fill(_color);
                g.rect(-o, -o, o-s, o-i);
                g.rect(-o, -o, o-i, o-s);
                g.rect( s, -o, o-s, o-i);
                g.rect( i, -o, o-i, o-s);
                g.rect(-o,  i, o-s, o-i);
                g.rect(-o,  s, o-i, o-s);
                g.rect( s,  i, o-s, o-i);
                g.rect( i,  s, o-i, o-s);
            };
            
            var _drawWinstonIcon = function(g) {
                g.image(pjs.getImage("creatures/Winston"),
                    0, 0, g.width, g.height);
            };
            var _drawAddIcon = function(g) {
                g.scale(g.width/100, g.height/100);
                g.noStroke();
                var l = 92;
                var w = 17;
                var r =  3;
                g.fill(0);
                g.rect(50-l/2-3, 50-w/2-3, l+6, w+6, r+6);
                g.rect(50-w/2-3, 50-l/2-3, w+6, l+6, r+6);
                g.fill(8, 212, 56);
                g.rect(50-l/2, 50-w/2, l, w, r);
                g.rect(50-w/2, 50-l/2, w, l, r);
            };
            var _drawRemoveIcon = function(g) {
                var color = pjs.color(212, 32, 8);
                var r = 48;
                var l = 70;
                var w = 15;
                
                g.scale(g.width/100, g.height/100);
                g.noStroke();
                g.fill(color);
                g.ellipse(50, 50, 2*r, 2*r);
                
                var mask = Graphics.create(g.width, g.height);
                mask.beginDraw();
                mask.scale(g.width/100, g.height/100);
                mask.translate(50, 50);
                mask.rotate(0.25 * pjs.PI);
                mask.noStroke();
                mask.fill(255);
                mask.rectMode(pjs.CENTER);
                mask.rect(0, 0, l, w);
                mask.rect(0, 0, w, l);
                Graphics.negate(mask);
                Graphics.mask(g, mask);
                mask.endDraw();
            };
            
            ButtonIcons.winston = Button.createIcon(_drawWinstonIcon);
            ButtonIcons.add     = Button.createIcon(_drawAddIcon);
            ButtonIcons.remove  = Button.createIcon(_drawRemoveIcon);
            ButtonIcons.none    = Button.createIcon(function(){});
            _color = Button.prototype.foreground;
            ButtonIcons.brush      = Button.createIcon(_drawBrushIcon);
            ButtonIcons.eraser     = Button.createIcon(_drawEraserIcon);
            ButtonIcons.stroke     = Button.createIcon(_drawStrokeIcon);
            ButtonIcons.layers     = Button.createIcon(_drawLayersIcon);
            ButtonIcons.select     = Button.createIcon(_drawSelectIcon);
            ButtonIcons.show       = Button.createIcon(_drawShowIcon);
            ButtonIcons.up         = Button.createIcon(_drawUpIcon);
            ButtonIcons.down       = Button.createIcon(_drawDownIcon);
            ButtonIcons.save       = Button.createIcon(_drawSaveIcon);
            ButtonIcons.fullscreen = Button.createIcon(_drawFullscreenIcon);
            _color = Button.prototype.foregroundActive;
            ButtonIcons.brushActive  = Button.createIcon(_drawBrushIcon);
            ButtonIcons.eraserActive = Button.createIcon(_drawEraserIcon);
            ButtonIcons.strokeActive = Button.createIcon(_drawStrokeIcon);
            ButtonIcons.layersActive = Button.createIcon(_drawLayersIcon);
            ButtonIcons.selectActive = Button.createIcon(_drawSelectIcon);
            ButtonIcons.showActive   = Button.createIcon(_drawShowIcon);
            ButtonIcons.upActive     = Button.createIcon(_drawUpIcon);
            ButtonIcons.downActive   = Button.createIcon(_drawDownIcon);
            ButtonIcons.saveActive   = Button.createIcon(_drawSaveIcon);
            
            return ButtonIcons;
        })();
        SaveLoad = (function() {

            var _bits = {
                VERSION: 7,
                SIZE: 2,
                TOOL: 4,
                BRUSH_SIZE: 7,
                ALPHA: 8,
                BLUR: 7,
                COLOR: 24,
                LAYERS_ADDED: 20,
                ACTION_COUNT: 24,
                ACTION_TYPE: 5,
                CHAR_COUNT: 6,
                CHAR_CODE: 8
            };

            var _converter, _validator;

            var SaveLoad = {
                save: function(data) {
                    if(!data) {
                        return;
                    }

                    var io = new IO();

                    try {
                        io.write(_bits.VERSION, VERSION);
                        io.write(_bits.SIZE, _converter.exportSize(data.width));
                        io.write(_bits.SIZE, _converter.exportSize(data.height));
                        io.write(_bits.TOOL, data.tool || 0);
                        io.write(_bits.BRUSH_SIZE, data.brushSize || defaults.BRUSH_SIZE);
                        io.write(_bits.ALPHA, data.alpha || defaults.ALPHA);
                        io.write(_bits.BLUR, data.blur || defaults.BLUR);
                        io.write(_bits.COLOR, data.color || defaults.COLOR);
                        io.write(_bits.LAYERS_ADDED, data.layersAdded || 1);
                        if(data.actions) {
                            var curr = data.currentAction;
                            io.write(_bits.ACTION_COUNT, curr !== undefined ? curr : -1);
                            _converter.exportActions(data.actions, io);
                        }

                        io.print();
                    } catch(err) {
                        pjs.println("Something went wrong while trying to save drawing.");
                    }

                    return true;
                },
                load: function() {
                    if(!save) {
                        return;
                    }
                    var io = new IO(save);

                    try {
                        if(!_validator.checkVersion(io.read(_bits.VERSION))) {
                            return false;
                        }

                        return {
                            width: _converter.importSize(io.read(_bits.SIZE)),
                            height: _converter.importSize(io.read(_bits.SIZE)),
                            tool: io.read(_bits.TOOL) || 0,
                            brushSize: _validator.filterBrushSize(io.read(_bits.BRUSH_SIZE)),
                            alpha: _validator.filterAlpha(io.read(_bits.ALPHA)),
                            blur: _validator.filterBlur(io.read(_bits.BLUR)),
                            color: _converter.importColor(io.read(_bits.COLOR)),
                            layersAdded: io.read(_bits.LAYERS_ADDED) || 1,
                            currentAction: _converter.importCurrentAction(io.read(_bits.ACTION_COUNT)),
                            actions: _converter.importActions(io)
                        };
                    } catch(err) {
                        pjs.println("Something went wrong while trying to load saved drawing.");
                        return false;
                    }
                }
            };

            _converter = {
                importSize: function(data) {
                    return 100 * (data % 3) + 400;
                },
                exportSize: function(size) {
                    return (size / 100) & 3;
                },
                importString: function(io) {
                    var str = "";
                    var length = io.read(_bits.CHAR_COUNT);
                    for(var i = 0; i < length; i++) {
                        var code = _validator.filterCharCode(io.read(_bits.CHAR_CODE));
                        str += String.fromCharCode(code);
                    }
                    return str;
                },
                exportString: function(str, io) {
                    str = str ? "" + str : "";
                    var length = pjs.min(str.length, pjs.pow(2, _bits.CHAR_COUNT) - 1);
                    io.write(_bits.CHAR_COUNT, length);
                    for(var i = 0; i < length; i++) {
                        var code = _validator.filterCharCode(str.charCodeAt(i));
                        io.write(_bits.CHAR_CODE, code);
                    }
                },
                importColor: function(data) {
                    return 0xFF000000 | (data !== false ? data : defaults.COLOR);
                },
                importCurrentAction: function(data) {
                    if(data === false || data === pjs.pow(2,_bits.ACTION_COUNT) - 1) {
                        return -1;
                    }
                    return data;
                },
                importActions: function(io) {
                    var actions = [];
                    var length = io.read(_bits.ACTION_COUNT);
                    for(var i = 0; i < length; i++) {
                        var type = io.read(_bits.ACTION_TYPE);
                        var action = {action: type};
                        var schema = Action.getSchema(type);
                        for(var j = 0; j < schema.length; j++) {
                            var meta = schema[j];
                            var value = this.importValue(io, meta);
                            action[meta.key] = value;
                        }
                        actions[i] = action;
                    }
                    return actions;
                },
                exportActions: function(actions, io) {
                    io.write(_bits.ACTION_COUNT, actions.length);
                    for(var i = 0; i < actions.length; i++) {
                        var action = actions[i];
                        io.write(_bits.ACTION_TYPE, action.action);
                        var schema = Action.getSchema(action.action);
                        for(var j = 0; j < schema.length; j++) {
                            var meta = schema[j];
                            var value = action[meta.key];
                            this.exportValue(value, io, meta);
                        }
                    }
                },
                importValue: function(io, meta) {
                    meta = meta || {};
                    var bits = meta.bits || 32;
                    var step = meta.step || 1;
                    var offset = meta.offset || 0;
                    var value, length, i;

                    switch(meta.type) {
                        case 'string':
                            return this.importString(io);
                        case 'color':
                            return this.importColor(io.read(_bits.COLOR));
                        case 'number':
                            return io.read(bits) * step + offset;
                        case 'array':
                            value = [];
                            length = io.read(bits);
                            for(i = 0; i < length; i++) {
                                value[i] = this.importValue(io, meta.content);
                            }
                            return value;
                    }
                },
                exportValue: function(value, io, meta) {
                    meta = meta || {};
                    var bits = meta.bits || 32;
                    var step = meta.step || 1;
                    var offset = meta.offset || 0;
                    var length, i;
                    
                    switch(meta.type) {
                        case 'string':
                            this.exportString(value, io);
                            break;
                        case 'color':
                            io.write(_bits.COLOR, value);
                            break;
                        case 'number':
                            value = (value - offset) / step;
                            if(bits < 32) {
                                value = pjs.constrain(value, 0, (1 << bits) - 1);
                            }
                            io.write(bits, pjs.round(value));
                            break;
                        case 'array':
                            value = value || [];
                            length = pjs.min(value.length, pjs.pow(2, bits) - 1);
                            io.write(bits, length);
                            for(i = 0; i < length; i++) {
                                this.exportValue(value[i], io, meta.content);
                            }
                            break;
                    }
                }
            };

            _validator = {
                checkVersion: function(ver) {
                    if(!ver) {
                        pjs.println("Invalid save string.");
                        return false;
                    }
                    if(ver > VERSION) {
                        pjs.println("That save string requires program version " + ver + " or higher. If you think this is a mistake, please double-check your string.");
                        return false;
                    }
                    return true;
                },
                filterCharCode: function(code) {
                    code = +code;
                    if(code < 32 || code > 255 || code >= 127 && code < 160) {
                        return 63;
                    }
                    return code;
                },
                filterBrushSize: function(size) {
                    return this.filterValue(size, 0, 100, defaults.BRUSH_SIZE);
                },
                filterAlpha: function(alpha) {
                    return this.filterValue(alpha, 0, 255, defaults.ALPHA);
                },
                filterBlur: function(blur) {
                    return this.filterValue(blur, 0, 100, defaults.BLUR);
                },
                filterValue: function(value, min, max, defaultVal) {
                    if(value === false) {
                        value = defaultVal !== undefined ? defaultVal : 0;
                    }
                    return pjs.constrain(value, min, max);
                }
            };

            return SaveLoad;
        })();

        var loadedData, canvas, toolbar, colorPanel, strokePanel, layersPanel;

        loadedData = SaveLoad.load() || {};

        canvas = new Canvas({
            y: 40,
            height: pjs.height - 40,
            imageWidth: loadedData.width || defaults.WIDTH,
            imageHeight: loadedData.height || defaults.HEIGHT,
            tool: loadedData.tool
        });
        colorPanel = (function() {
            var colorPanel = new Panel({
                x: pjs.width - 200,
                y: 40,
                width: 200,
                height: 144,
                hidden: true
            });
            
            var colorPicker, inputR, inputG, inputB, labels, colorPreview;
            
            var onInputChange = function() {
                this.text = pjs.constrain(+this.text, 0, 255).toString();
                var clr = pjs.color(+inputR.text, +inputG.text, +inputB.text);
                colorPicker.setColor(clr);
            };
            
            inputR = new Input({
                parent: colorPanel,
                x: 160,
                y: 5,
                isNumberInput: true,
                onChange: onInputChange
            });
            inputG = new Input({
                parent: colorPanel,
                x: 160,
                y: 35,
                isNumberInput: true,
                onChange: onInputChange
            });
            inputB = new Input({
                parent: colorPanel,
                x: 160,
                y: 65,
                isNumberInput: true,
                onChange: onInputChange
            });
            labels = new Component({
                x: 144,
                y: 6,
                width: 15,
                height: 78,
                parent: colorPanel,
                draw: function(g) {
                    g.textAlign(pjs.RIGHT, pjs.CENTER);
                    g.text('R:', this.width, 10);
                    g.text('G:', this.width, 40);
                    g.text('B:', this.width, 70);
                    this.needsRedraw = false;
                }
            });
            colorPreview = new Component({
                parent: colorPanel,
                x: 144,
                y: 96,
                width: 52,
                height: 40,
                draw: function(g) {
                    g.fill(this.background);
                    g.rect(0,0,this.width-1,this.height-1);
                    this.lastDrawnColor = this.background;
                },
                needsRedraw: function() {
                    return this.lastDrawnColor !== this.background;
                }
            });
            colorPicker = new ColorPicker({
                x: 1,
                y: 1,
                parent: colorPanel,
                color: loadedData.color || defaults.COLOR,
                size: 140,
                onColorChange: function() {
                    inputR.text = pjs.red(this.color).toString();
                    inputG.text = pjs.green(this.color).toString();
                    inputB.text = pjs.blue(this.color).toString();
                    colorPreview.background = this.color;
                    canvas.color = this.color;
                }
            });
            
            colorPanel.getColor = function() { return colorPicker.color; };
            
            return colorPanel;
        })();
        strokePanel = (function() {
            var width = 145;
            var height = 142;
            var labelX = 8;
            var labelY = 7;
            var sliderX = 3;
            var sliderY = 26;
            var inputX = 104;
            var inputY = 23;
            var dist = 42;
            var labelText = ["Brush Size", "Alpha", "Blur"];
            
            var strokePanel = new Panel({
                x: pjs.width - width,
                y: 40,
                width: width,
                height: height,
                hidden: true
            });
            
            var _drawLabel = function(g) {
                g.textSize(14);
                g.textAlign(pjs.LEFT, pjs.CENTER);
                g.text(this.text, 0, 0.5*g.height);
                this.needsRedraw = false;
            };
            
            for(var i = 0; i < 3; i++) {
                var label = new Component({
                    parent: strokePanel,
                    x: labelX,
                    y: labelY + i*dist,
                    width: 90,
                    height: 18,
                    draw: _drawLabel
                });
                label.text = labelText[i];
            }

            var _onInputChange = function() {
                this.text = pjs.constrain(+this.text, 0, 255).toString();
                this.slider.setValue(+this.text);
            };
            
            var sizeInput = new Input({
                parent: strokePanel,
                x: inputX,
                y: inputY,
                isNumberInput: true,
                onChange: _onInputChange
            });
            var alphaInput = new Input({
                parent: strokePanel,
                x: inputX,
                y: inputY + dist,
                isNumberInput: true,
                onChange: _onInputChange
            });
            var blurInput = new Input({
                parent: strokePanel,
                x: inputX,
                y: inputY + 2*dist,
                isNumberInput: true,
                onChange: _onInputChange
            });

            var sizeSlider = new Slider({
                parent: strokePanel,
                x: sliderX,
                y: sliderY,
                value: loadedData.brushSize || defaults.BRUSH_SIZE,
                onChange: function() {
                    sizeInput.text = this.value.toFixed();
                    canvas.size = +sizeInput.text;
                }
            });
            var alphaSlider = new Slider({
                parent: strokePanel,
                x: sliderX,
                y: sliderY + dist,
                value: loadedData.alpha || defaults.ALPHA,
                max: 255,
                onChange: function() {
                    alphaInput.text = this.value.toFixed();
                    canvas.alpha = +alphaInput.text;
                }
            });
            var blurSlider = new Slider({
                parent: strokePanel,
                x: sliderX,
                y: sliderY + 2*dist,
                value: loadedData.blur || defaults.BLUR,
                onChange: function() {
                    blurInput.text = this.value.toFixed();
                    canvas.blur = +blurInput.text;
                }
            });
            
            sizeInput .slider = sizeSlider;
            alphaInput.slider = alphaSlider;
            blurInput .slider = blurSlider;
            
            return strokePanel;
        })();
        layersPanel = (function() {
            
            // Must change action bits if this ever changes
            var _MAX_LAYERS = 32;
            
            var layersPanel = new Panel({
                x: pjs.width - 205,
                y: 40,
                width: 205,
                height: pjs.height - 40,
                hidden: true
            });
            layersPanel.layersAdded = loadedData.layersAdded || 1;
            
            var layerList;
            
            var newLayerlabel = new Component({
                x: 7,
                y: 3,
                width: 100,
                height: 20,
                parent: layersPanel,
                draw: function(g) {
                    g.textSize(15);
                    g.textAlign(pjs.LEFT, pjs.CENTER);
                    g.text('Add Layer', 0, this.height / 2);
                    this.needsRedraw = false;
                }
            });
            var newLayerInput = new Input({
                parent: layersPanel,
                x: 5,
                y: 22,
                width: layersPanel.width - 48,
                text: "Layer " + layersPanel.layersAdded
            });
            var newLayerButton = new Button({
                parent: layersPanel,
                x: layersPanel.width - 40,
                y: 10,
                onToggle: function(active) {
                    if(active) {
                        canvas.addLayer(newLayerInput.text);
                        newLayerInput.text = "Layer " + (++layersPanel.layersAdded);
                    }
                },
                icon: ButtonIcons.add
            });
            
            canvas.addOnLayerChange(function() {
                var count = canvas.layers.length;
                newLayerButton.setEnabled(count < _MAX_LAYERS);
            });
            
            var layerslabel = new Component({
                x: 7,
                y: 50,
                width: 60,
                height: 20,
                parent: layersPanel,
                draw: function(g) {
                    g.textSize(15);
                    g.textAlign(pjs.LEFT, pjs.CENTER);
                    g.text('Layers', 0, this.height / 2);
                    this.needsRedraw = false;
                }
            });
            var scroller = new Scroller({
                parent: layersPanel,
                x: 4,
                y: 70,
                width: layersPanel.width - 6,
                height: layersPanel.height - 72
            });
            layerList = new LayerList({
                parent: scroller,
                canvas: canvas
            });
            
            return layersPanel;
        })();
        toolbar = (function() {
            var toolbar = new Panel({
                height: 40
            });
            
            var toolButtons = [];
            var propertyButtons = [];
            
            var brushButton = new Button({
                parent: toolbar,
                x: 3,
                y: 3,
                cropToParent: true,
                buttonGroup: toolButtons,
                clickBehavior: Button.ACTIVATE,
                isActive: canvas.getTool() === 'brush',
                onToggle: function(active) {
                    if(active)
                        { canvas.setTool('brush'); }
                },
                icon: ButtonIcons.brush,
                iconActive: ButtonIcons.brushActive
            });
            var eraserButton = new Button({
                parent: toolbar,
                x: 38,
                y: 3,
                buttonGroup: toolButtons,
                clickBehavior: Button.ACTIVATE,
                isActive: canvas.getTool() === 'eraser',
                onToggle: function(active) {
                    if(active)
                        { canvas.setTool('eraser'); }
                },
                icon: ButtonIcons.eraser,
                iconActive: ButtonIcons.eraserActive
            });
            
            var colorButton = new Button({
                parent: toolbar,
                x: pjs.width - 183,
                y: 3,
                buttonGroup: propertyButtons,
                clickBehavior: Button.TOGGLE,
                onToggle: function(active) {
                    if(active)
                        { colorPanel.show(); }
                    else
                        { colorPanel.hide(); }
                },
                drawIcon: function(g) {
                    g.noStroke();
                    var clr = colorPanel.getColor();
                    g.fill(clr);
                    g.rect(2, 2, g.width - 4, g.height - 4, 3);
                    this.lastDrawnColor = clr;
                },
                iconNeedsRedraw: function(g) {
                    return this.lastDrawnColor !== colorPanel.getColor();
                }
            });
            var strokeButton = new Button({
                parent: toolbar,
                x: pjs.width - 148,
                y: 3,
                buttonGroup: propertyButtons,
                clickBehavior: Button.TOGGLE,
                onToggle: function(active) {
                    if(active)
                        { strokePanel.show(); }
                    else
                        { strokePanel.hide(); }
                },
                icon: ButtonIcons.stroke,
                iconActive: ButtonIcons.strokeActive
            });
            var layersButton = new Button({
                parent: toolbar,
                x: pjs.width - 113,
                y: 3,
                buttonGroup: propertyButtons,
                clickBehavior: Button.TOGGLE,
                onToggle: function(active) {
                    if(active)
                        { layersPanel.show(); }
                    else
                        { layersPanel.hide(); }
                },
                icon: ButtonIcons.layers,
                iconActive: ButtonIcons.layersActive
            });

            var separator = new Component({
                parent: toolbar,
                x: pjs.width - 76,
                y: 5,
                width: 1,
                height: toolbar.height - 10,
                foreground: pjs.color(168, 168, 168),
                draw: function(g) {
                    g.background(this.foreground);
                    this.needsRedraw = false;
                }
            });

            var fullscreenButton = new Button({
                parent: toolbar,
                x: pjs.width - 72,
                y: 3,
                onToggle: function(active) {
                    if(active)
                        { canvas.toggleFullscreen(true); }
                },
                icon: ButtonIcons.fullscreen,
            });
            var saveButton = new Button({
                parent: toolbar,
                x: pjs.width - 37,
                y: 3,
                onToggle: function(active) {
                    if(active) {
                        SaveLoad.save({
                            width: canvas.imageWidth,
                            height: canvas.imageHeight,
                            tool: canvas.tool,
                            alpha: canvas.alpha,
                            brushSize: canvas.size,
                            blur: canvas.blur,
                            color: canvas.color,
                            layersAdded: layersPanel.layersAdded,
                            actions: canvas.actions,
                            currentAction: canvas.currentAction
                        });
                    }
                },
                icon: ButtonIcons.save,
                iconActive: ButtonIcons.saveActive
            });
            
            return toolbar;
        })();
        
        if(loadedData.actions) {
            canvas.actions = loadedData.actions;
            canvas.playback(loadedData.currentAction);
        }

        // Global event handlers {
        pjs.mousePressed = function() {
            var x = pjs.mouseX;
            var y = pjs.mouseY;
            var comp = Component.getComponentAt(x, y);
            var propagate;
            Component.unpressAll();
            var gotFocus = false;
            while(comp) {
                if(propagate !== false) {
                    propagate = comp.press(x - comp.globalX, y - comp.globalY);
                }
                if(!gotFocus && comp.focusable) {
                    comp.focus();
                    gotFocus = true;
                }
                comp = comp.parent;
            }
            if(!gotFocus) {
                Component.clearFocus();
            }
        };
        pjs.mouseMoved = function() {
            var comp = Component.getComponentAt(pjs.mouseX, pjs.mouseY);
            if(comp) {
                comp.hover();
            }
        };
        pjs.mouseDragged = function() {
            pjs.mouseMoved();
            Component.dragPressed();
        };
        pjs.mouseReleased = function() {
            Component.unpressAll();
        };
        pjs.mouseScrolled = function() {
            if(modifierKeys[pjs.SHIFT]) {
                var comp = Component.getFocusedComponent() ||
                           Component.getComponentAt(pjs.mouseX, pjs.mouseY);
                if(comp) {
                    var propagate;
                    while(comp && propagate !== false) {
                        if(comp.mouseScrolled)
                            { propagate = comp.mouseScrolled(pjs.mouseScroll); }
                        comp = comp.parent;
                    }
                }
            }
        };
        pjs.keyPressed = function() {
            if( pjs.keyCode === pjs.ALT ||
                pjs.keyCode === pjs.CONTROL ||
                pjs.keyCode === pjs.SHIFT )
                { modifierKeys[pjs.keyCode] = true; }
            var comp = Component.getFocusedComponent();
            var propagate = true;
            if(comp && comp.keyPressed)
                { propagate = comp.keyPressed(); }
            if(propagate !== false) {
                if(pjs.keyCode === pjs.TAB) {
                    if(modifierKeys[pjs.SHIFT]) {
                        Component.focusPrevious();
                    } else {
                        Component.focusNext();
                    }
                }
            }
        };
        pjs.keyTyped = function() {
            var comp = Component.getFocusedComponent();
            if(comp && comp.keyTyped) {
                comp.keyTyped();
            }
        };
        pjs.keyReleased = function() {
            if( pjs.keyCode === pjs.ALT ||
                pjs.keyCode === pjs.CONTROL ||
                pjs.keyCode === pjs.SHIFT )
                { modifierKeys[pjs.keyCode] = false; }
            var comp = Component.getFocusedComponent();
            if(comp && comp.keyReleased)
                { comp.keyReleased(); }
        };
        // }

        pjs.draw = function() {
            var worker = Worker.getWorker();

            if(!pjs.focused) {
                Component.clearFocus();
            }
            if(Component.hasChanges()) {
                Component.drawAll();
            }
            if(worker.hasPendingTasks()) {
                worker.work();
            }
            if(!pjs.show) {
                pjs.background(255);
                pjs.draw = function() {};
            }
        };
        Component.drawAll();
    };
    
    // Remove KA-injected code {
    init = init.toString()
        .replace(/__env__\./g,'')
        .replace(/\n +KAInfiniteLoopCount\+\+;/g,'')
        .replace(/\n +if \(KAInfiniteLoopCount > 1000\) {[^']+?'.+?'[^}]+?}/g,'')
        .replace(/PJSCodeInjector.applyInstance\((.+?),.+?\)/, function(a,b) {
            return 'new ' + b;
        })
        .replace(/function \([^)]*?\) {\n/,'');
    init = init.substring(0, init.lastIndexOf('\n'));
    init = init.toString.constructor('pjs', init);
    // }
    
    init(this);
};
if(show) {
    main();
}
