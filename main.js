/****************************************
 *                                      *
 * Made by Une (@unern) on Khan Academy *
 *                                      *
 ****************************************/

var show = 1;

var main = function() {
    var init = function(pjs) {
        
        var modifierKeys = {};
        
        var Vectors, Graphics, ButtonIcons;
    
        var Component = (function() {
            var _pressedComps = [];
            var _focusableComps = [];
            var _focusedComp;
            var _hoveredComp;
            var _changes = [ false ];
            
            var _getCommonAncestor;
            
            var Component = function(config) {
                config = config || {};
                (config.parent || Component.root).addChild(this, config);
                this.children = [];
                if(config.x) { this.x = config.x; }
                if(config.y) { this.y = config.y; }
                this.globalX = this.parent.globalX + this.x;
                this.globalY = this.parent.globalY + this.y;
                this.width  = config.width  || this.parent.width;
                this.height = config.height || this.parent.height;
                this.graphics = Graphics.create(this.width, this.height);
                if(config.background !== undefined)
                    { this.background = config.background; }
                if(config.foreground !== undefined)
                    { this.foreground = config.foreground; }
                if(config.draw)
                    { this.draw = config.draw; }
                if(config.needsRedraw)
                    { this.needsRedraw = config.needsRedraw; }
                if(config.hidden)
                    { this.hidden = config.hidden; }
                if( config.cropToParent ||
                    (config.cropToParent = this.parent.cropToParent) )
                    { this.cropToParent = config.cropToParent; }
                if(config.onResize)
                    { this.onResize = config.onResize; }
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
                if(config.keyPressed ) { this.keyPressed  = config.keyPressed; }
                if(config.keyTyped   ) { this.keyTyped    = config.keyTyped; }
                if(config.keyReleased) { this.keyReleased = config.keyReleased; }
                if(config.focusGained) { this.focusGained = config.focusGained; }
                if(config.focusLost  ) { this.focusLost   = config.focusLost; }
                if(config.focusable !== undefined) {
                    this.focusable = !!config.focusable;
                }
                if(this.focusable) {
                    this.tabIndex = _focusableComps.length;
                    _focusableComps.push(this);
                }
            };
            Component.root = Component.prototype = {
                generation: 0,
                x: 0,
                y: 0,
                globalX: 0,
                globalY: 0,
                width: pjs.width,
                height: pjs.height,
                graphics: pjs,
                children: [],
                background: 0x00ffffff,
                foreground: 0xff000000,
                isPressed: false,
                focusable: false,
                needsRedraw: true,
                draw: function(g) {}, // Override
                drawChildren: function() {
                    for(var i = 0; i < this.children.length; i++) {
                        var child = this.children[i];
                        if( child.hidden ) { continue; }
                        if( child.needsRedraw === true ||
                            typeof child.needsRedraw === 'function' &&
                            child.needsRedraw()
                        ) {
                            child.graphics.beginDraw();
                            child.draw(child.graphics);
                            child.graphics.endDraw();
                        }
                        var img = child.getCrop();
                        if(img) {
                            pjs.image(img.graphics,
                                    child.globalX + img.x,
                                    child.globalY + img.y);
                        }
                        child.drawChildren();
                    }
                },
                getCrop: function() {
                    var x0 = 0, x1 = pjs.width;
                    var y0 = 0, y1 = pjs.height;
                    var comp = this;
                    do {
                        x0 = pjs.max(x0, comp.globalX);
                        y0 = pjs.max(y0, comp.globalY);
                        x1 = pjs.min(x1, comp.globalX + comp.width);
                        y1 = pjs.min(y1, comp.globalY + comp.height);
                    } while(comp.cropToParent && (comp = comp.parent));
                    if(x1 <= x0 || y1 <= y0) { return; }
                    var img = {
                        graphics: this.graphics,
                        x: x0 - this.globalX,
                        y: y0 - this.globalY,
                        width:  x1 - x0,
                        height: y1 - y0
                    };
                    if( img.x || img.width  !== this.width ||
                        img.y || img.height !== this.height )
                    {
                        img.graphics = img.graphics.get(
                            img.x, img.y, img.width, img.height
                        );
                    }
                    return img;
                },
                setLocation: function(x, y) {
                    if(this.x !== x || this.y !== y) {
                        this.x = x;
                        this.y = y;
                        this.updateGlobalCoords();
                        Component.setChange();
                    }
                },
                resize: function(w, h) {
                    if(this.width !== w || this.height !== h) {
                        var before = {
                            width: this.width,
                            height: this.height
                        };
                        this.width = w;
                        this.height = h;
                        this.graphics = Graphics.create(w, h);
                        if(!this.needsRedraw) {
                            this.needsRedraw = true;
                        }
                        if(this.onResize) {
                            this.onResize({
                                target: this,
                                before: before
                            });
                        }
                        Component.setChange();
                    }
                },
                updateGlobalCoords: function() {
                    var globalX = this.parent.globalX + this.x;
                    var globalY = this.parent.globalY + this.y;
                    if(globalX !== this.globalX || globalY !== this.globalY) {
                        this.globalX = globalX;
                        this.globalY = globalY;
                        for(var i = 0; i < this.children.length; i++) {
                            this.children[i].updateGlobalCoords();
                        }
                    }
                },
                containsGlobalPt: function(x, y) {
                    x -= this.globalX;
                    y -= this.globalY;
                    return 0 <= x && x < this.width && 0 <= y && y < this.height;
                },
                addChild: function(comp, config) {
                    if(!comp.parent) {
                        comp.parent = this;
                        comp.generation = this.generation + 1;
                        this.children.push(comp);
                    }
                },
                removeChild: function(index) {
                    this.children[index].hide();
                    this.children.splice(index, 1);
                    Component.setChange();
                },
                getDescendantAt: function(x, y) {
                    var globalX = this.globalX + x;
                    var globalY = this.globalY + y;
                    for(var i = this.children.length - 1; i >= 0; i--) {
                        var child = this.children[i];
                        if(!child.hidden && child.containsGlobalPt(globalX, globalY)) {
                            var desc = child.getDescendantAt(x - child.x, y - child.y);
                            return desc || child;
                        }
                    }
                },
                press: function(x, y) {
                    if(!this.isPressed) {
                        this.isPressed = true;
                        _pressedComps.push(this);
                        if(this.mousePressed) {
                            return this.mousePressed({x:x, y:y});
                        }
                    }
                },
                hover: function() {
                    if(_hoveredComp === this) {
                        return;
                    }
                    var comp1 = this;
                    var comp2 = _hoveredComp;
                    _hoveredComp = this;
                    if(comp2) {
                        var ancestor = _getCommonAncestor(comp1, comp2);
                        while(comp2 !== ancestor) {
                            if(comp2.mouseLeft) {
                                comp2.mouseLeft();
                            }
                            comp2 = comp2.parent;
                        }
                        while(comp1 !== ancestor) {
                            if(comp1.mouseEntered) {
                                comp1.mouseEntered();
                            }
                            comp1 = comp1.parent;
                        }
                    } else {
                        while(comp1) {
                            if(comp1.mouseEntered) {
                                comp1.mouseEntered();
                            }
                            comp1 = comp1.parent;
                        }
                    }
                },
                hasFocus: function() {
                    return _focusedComp === this;
                },
                focus: function() {
                    if(this.focusable && _focusedComp !== this) {
                        if(_focusedComp) {
                            _focusedComp.blur();
                        }
                        _focusedComp = this;
                        if(this.focusGained) {
                            this.focusGained();
                        }
                        Component.setChange();
                    }
                },
                blur: function() {
                    if(_focusedComp === this) {
                        _focusedComp = undefined;
                        if(this.focusLost) {
                            this.focusLost();
                        }
                        Component.setChange();
                    }
                },
                show: function() {
                    if(this.hidden) {
                        this.hidden = false;
                        if(this.isVisible()) {
                            Component.setChange();
                        }
                    }
                },
                hide: function() {
                    if(this.hidden) { return; }
                    var willRedraw = this.isVisible();
                    this.hidden = true;
                    if(_focusedComp && _getCommonAncestor(this, _focusedComp) === this) {
                        _focusedComp.blur();
                    }
                    if(willRedraw) {
                        Component.setChange();
                    }
                },
                isVisible: function() {
                    var comp = this;
                    while(comp) {
                        if(comp.hidden) {
                            return false;
                        }
                        comp = comp.parent;
                    }
                    return true;
                }
            };
            Component.drawAll = function() {
                _changes[0] = false;
                pjs.background(255, 255, 255);
                if(!Component.root.hidden) {
                    Component.root.draw(pjs);
                    Component.root.drawChildren();
                }
            };
            Component.setChange = function() {
                _changes[0] = true;
            };
            Component.trackChange = function(func) {
                _changes.push(func);
            };
            Component.hasChanges = function() {
                if(_changes[0]) {
                    return true;
                }
                for(var i = 1; i < _changes.length; i++) {
                    if(_changes[i]()) {
                        return true;
                    }
                }
                return false;
            };
            Component.getComponentAt = function(x, y) {
                var root = Component.root;
                if(!root.containsGlobalPt(x, y) || root.hidden) {
                    return;
                }
                var comp = root.getDescendantAt(x, y);
                return comp || root;
            };
            Component.dragPressed = function() {
                var x = pjs.mouseX;
                var y = pjs.mouseY;
                var propagate;
                for(var i = 0; i < _pressedComps.length; i++) {
                    var comp = _pressedComps[i];
                    if(comp.mouseDragged && propagate !== false) {
                        propagate = comp.mouseDragged({
                            x: x - comp.globalX,
                            y: y - comp.globalY
                        });
                    }
                }
            };
            Component.unpressAll = function() {
                var x = pjs.mouseX;
                var y = pjs.mouseY;
                var propagate;
                for(var i = 0; i < _pressedComps.length; i++) {
                    var comp = _pressedComps[i];
                    comp.isPressed = false;
                    if(comp.mouseReleased && propagate !== false) {
                        propagate = comp.mouseReleased({
                            x: x - comp.globalX,
                            y: y - comp.globalY
                        });
                    }
                }
                _pressedComps = [];
            };
            Component.getFocusedComponent = function() {
                return _focusedComp;
            };
            Component.focusPrevious = function() {
                if(_focusedComp) {
                    var count =  _focusableComps.length;
                    var i = (_focusedComp.tabIndex + count - 1) % count;
                    _focusableComps[i].focus();
                    return _focusedComp;
                }
            };
            Component.focusNext = function() {
                if(_focusedComp) {
                    var i = (_focusedComp.tabIndex + 1) % _focusableComps.length;
                    _focusableComps[i].focus();
                    return _focusedComp;
                }
            };
            Component.clearFocus = function() {
                if(_focusedComp) {
                    _focusedComp.blur();
                }
            };
            
            _getCommonAncestor = function(comp1, comp2) {
                while(comp1.generation > comp2.generation) {
                    comp1 = comp1.parent;
                }
                while(comp2.generation > comp1.generation) {
                    comp2 = comp2.parent;
                }
                while(comp1 !== comp2) {
                    comp1 = comp1.parent;
                    comp2 = comp2.parent;
                }
                return comp1;
            };
            return Component;
        })();
        var Panel = (function() {
            var _drawBorder;
            
            var Panel = function(config) {
                config = config || {};
                Component.call(this, Object.assign({
                    background: pjs.color(81, 95, 99)
                }, config));
            };
            Panel.prototype = Object.assign(Object.create(Component.prototype), {
                draw: function(g) {
                    g.background(this.background);
                    _drawBorder(g,2,pjs.color(143, 143, 143),pjs.color(1, 15, 54));
                    this.needsRedraw = false;
                }
            });
            _drawBorder = function(g, thickness, cT, cB, cL, cR) {
                cB = cB === undefined ? cT : cB;
                cL = cL === undefined ? cT : cL;
                cR = cR === undefined ? cB : cR;
                var w = g.width;
                var h = g.height;
                g.pushStyle();
                g.noStroke();
                g.fill(cT);
                g.quad(0,0,thickness,thickness,w-thickness,thickness,w,0);
                g.fill(cB);
                g.quad(w,h,w-thickness,h-thickness,thickness,h-thickness,0,h);
                g.fill(cL);
                g.quad(0,h,thickness,h-thickness,thickness,thickness,0,0);
                g.fill(cR);
                g.quad(w,0,w-thickness,thickness,w-thickness,h-thickness,w,h);
                g.popStyle();
            };
            return Panel;
        })();
        var Button = (function() {
            var _MARGIN = 3;
            var _DEFAULT_SIZE = 34;
            var _redrawIcon;
            var Button = function(config) {
                config = config || {};
                Component.call(this, Object.assign({
                    width: _DEFAULT_SIZE,
                    height: _DEFAULT_SIZE
                },config));
                if(config.buttonGroup) {
                    this.buttonGroup = config.buttonGroup;
                    this.buttonGroup.push(this);
                }
                if(config.clickBehavior)
                    { this.clickBehavior = config.clickBehavior; }
                if(config.onToggle) { this.onToggle = config.onToggle; }
                if(config.isActive) { this.setActive(true); }
                if(config.isEnabled === false) { this.setEnabled(false); }
                if(config.drawIcon) {
                    this.drawIcon = config.drawIcon;
                    _redrawIcon(this);
                    if(config.iconNeedsRedraw)
                        { this.iconNeedsRedraw = config.iconNeedsRedraw; }
                } else if(config.icon) {
                    this.icon = config.icon.__isPImage ?
                            ButtonIcons.fromImage(config.icon) :
                            config.icon;
                    if(config.iconActive) {
                        this.iconActive = config.iconActive.__isPImage ?
                                ButtonIcons.fromImage(config.iconActive) :
                                config.iconActive;
                    }
                } else {
                    this.icon = ButtonIcons.winston;
                }
                if(config.backgroundHover)
                    { this.backgroundHover = config.backgroundHover; }
                if(config.backgroundActive)
                    { this.backgroundActive = config.backgroundActive; }
                if(config.onActivationToggle) { this.onClick = config.onClick; }
            };
            Button.TOGGLE     = 'toggle';
            Button.ACTIVATE   = 'activate';
            Button.DEACTIVATE = 'deactivate';
            Button.prototype = Object.assign(Object.create(Component.prototype), {
                isEnabled: true,
                isActive: false,
                clickBehavior: Button.DEACTIVATE,
                background:       pjs.color(204, 210, 217),
                backgroundHover:  pjs.color(192, 196, 209),
                backgroundActive: pjs.color(38, 60, 92),
                foreground:       pjs.color(11, 41, 61),
                foregroundActive: pjs.color(178, 226, 240),
                mouseEntered: function() {
                    if(!this.isEnabled)
                        { return; }
                    this.isHovered = true;
                    if(this.clickBehavior !== Button.ACTIVATE || !this.isActive) {
                        pjs.cursor(pjs.HAND);
                        if(!this.isActive) {
                            Component.setChange();
                        }
                    }
                },
                mouseLeft: function() {
                    this.isHovered = false;
                    pjs.cursor(pjs.ARROW);
                    if(this.isEnabled && !this.isActive) {
                        Component.setChange();
                    }
                },
                mousePressed: function() {
                    if(!this.isEnabled)
                        { return false; }
                    this.setActive( this.clickBehavior !== Button.TOGGLE ||
                                   !this.isActive);
                    if(this.clickBehavior === Button.ACTIVATE && this.isActive) {
                        pjs.cursor(pjs.ARROW);
                    }
                    return false;
                },
                mouseReleased: function() {
                    if(this.clickBehavior === Button.DEACTIVATE) {
                        this.setActive(false);
                    }
                },
                setActive: function(active) {
                    if(this.isActive !== (active = !!active)) {
                        this.isActive = active;
                        if(this.onToggle) {
                            this.onToggle(active);
                        }
                        if(active && this.buttonGroup) {
                            for(var i = 0; i < this.buttonGroup.length; i++) {
                                var btn = this.buttonGroup[i];
                                if(btn !== this) {
                                    btn.setActive(false);
                                }
                            }
                        }
                        Component.setChange();
                    }
                },
                setEnabled: function(enabled) {
                    if(this.isEnabled !== (enabled = !!enabled)) {
                        this.isEnabled = enabled;
                        if(!enabled) {
                            this.isHovered = false;
                            this.setActive(false);
                        }
                        Component.setChange();
                    }
                },
                draw: function(g) {
                    g.fill(this.isActive  ? this.backgroundActive :
                          (this.isHovered ? this.backgroundHover  :
                                            this.background));
                    g.rect(0, 0, g.width-1, g.height-1, 3);
                    
                    if( this.iconNeedsRedraw === true ||
                        typeof this.iconNeedsRedraw === 'function' &&
                        this.iconNeedsRedraw()
                    ) {
                        _redrawIcon(this);
                    }
                    var icon = (this.isActive && this.iconActive) || this.icon;
                    Graphics.image(g, icon,
                            _MARGIN, _MARGIN,
                            g.width - 2*_MARGIN, g.height - 2*_MARGIN,
                            this.isEnabled ? 255 : 60);
                }
            });
            Button.createIcon = function(drawFunc, btnW, btnH) {
                btnW = btnW || _DEFAULT_SIZE;
                btnH = btnH || _DEFAULT_SIZE;
                var g = Graphics.create(btnW - 2*_MARGIN, btnH - 2*_MARGIN);
                g.beginDraw();
                drawFunc(g);
                g.endDraw();
                return g;
            };
            _redrawIcon = function(btn) {
                if(!btn.drawIcon) { return; }
                btn.icon = Button.createIcon(
                        btn.drawIcon.bind(btn),
                        btn.width,
                        btn.height);
            };
            return Button;
        })();
        var ColorPicker = (function() {
            var _R_OUTER = 0.95;
            var _R_INNER = 0.8;
            var _R_TRIANGLE = 0.75;
            var _HUE_SECTION = 0;
            var _SB_SECTION = 1;
            
            var _getTrianglePts, _getSBAt, _setHuePoint, _setSBPoint, _getSBPoint;
            var ColorPicker = function(config) {
                config = config || {};
                delete config.width;
                delete config.height;
                if(config.size) { this.size = config.size; }
                Component.call(this, Object.assign({
                    width:  this.size,
                    height: this.size,
                }, config));
                if(config.onColorChange) {
                    this.onColorChange = config.onColorChange;
                }
                this.setColor(config.color || 0xff000000);
            };
            ColorPicker.prototype = Object.assign(Object.create(Component.prototype), {
                size: 140,
                setColor: function(clr) {
                    this.setHSB(pjs.hue(clr), pjs.saturation(clr), pjs.brightness(clr),clr);
                },
                setHSB: function(hue, sat, bri, clr) {
                    if(clr !== undefined) { clr |= 0xff000000; }
                    var g = this.graphics;
                    g.colorMode(pjs.HSB);
                    var hsb = this.hsb;
                    if(
                        !hsb || hue !== hsb[0] || sat !== hsb[1] || bri !== hsb[2] ||
                        (clr && clr !== this.color)
                    ) {
                        this.hsb = [hue, sat, bri];
                        this.color = clr || g.color(hue, sat, bri);
                        this.angle = 24/17 * hue;
                        if(this.onColorChange) {
                            this.onColorChange();
                        }
                        Component.setChange();
                    }
                },
                draw: function(g) {
                    var halfSz = this.size/2 | 0;
                    var rOut = _R_OUTER * halfSz;
                    var rIn  = _R_INNER * halfSz;
                    var rOutSq = rOut * rOut;
                    var rInSq  = rIn  * rIn;
                    var trianglePts = _getTrianglePts(_R_TRIANGLE*halfSz, this.angle);
                    g.colorMode(pjs.HSB);
                    g.background(0, 0, 0, 0);
                    g.loadPixels();
                    var data = g.imageData.data;
                    for(var y = -halfSz, i = 0; y < halfSz; y++, i += (this.size&1) << 2) {
                        for(var x = -halfSz; x < halfSz; x++, i += 4) {
                            var distSq = x*x + y*y, sb;
                            var angle = (pjs.atan2(-y, x) + 360) % 360;
                            if(rInSq < distSq && distSq < rOutSq) {
                                var clr = g.color(17/24 * angle, 255, 255);
                                data[i    ] = pjs.red(clr);
                                data[i + 1] = pjs.green(clr);
                                data[i + 2] = pjs.blue(clr);
                                data[i + 3] = 255;
                            }
                            else if( (sb = _getSBAt(x, y, trianglePts)) ) {
                                var clr = g.color(this.hsb[0], sb[0], sb[1]);
                                data[i    ] = pjs.red(clr);
                                data[i + 1] = pjs.green(clr);
                                data[i + 2] = pjs.blue(clr);
                                data[i + 3] = 255;
                            }
                        }
                    }
                    g.updatePixels();
                    
                    g.pushMatrix();
                    g.translate(halfSz, halfSz);
                    
                    g.noFill();
                    g.stroke(0);
                    g.strokeWeight(0.02*halfSz);
                    var pt = _getSBPoint(this, trianglePts);
                    g.ellipse(pt.x, pt.y, 0.1*halfSz, 0.1*halfSz);
                    
                    g.rotate(-pjs.radians(this.angle));
                    
                    var strokeWt = 0.04*halfSz;
                    g.strokeWeight(strokeWt);
                    var ht = 0.12*halfSz;
                    g.rect(rIn - 0.5*strokeWt,-0.5*ht,rOut - rIn + strokeWt,ht);
                    g.popMatrix();
                    
                    this.lastDrawnColor = this.color;
                    this.lastDrawnAngle = this.angle;
                },
                needsRedraw: function() {
                    return  this.lastDrawnColor !== this.color ||
                            this.lastDrawnAngle !== this.angle;
                },
                mousePressed: function(e) {
                    var halfSz = this.size/2 | 0;
                    var rOut = _R_OUTER * halfSz;
                    var rIn  = _R_INNER * halfSz;
                    e.x -= halfSz;
                    e.y -= halfSz;
                    var dist = pjs.sqrt(e.x * e.x + e.y * e.y);
                    if(rIn <= dist && dist <= rOut) {
                        this.draggedSection = _HUE_SECTION;
                        _setHuePoint(this, e.x, e.y);
                    } else {
                        var triPts = _getTrianglePts(_R_TRIANGLE*halfSz, this.angle);
                        var sb = _getSBAt(e.x, e.y, triPts);
                        if(sb) {
                            this.draggedSection = _SB_SECTION;
                            this.setHSB(this.hsb[0], sb[0], sb[1]);
                        } else {
                            this.draggedSection = undefined;
                            return;
                        }
                    }
                },
                mouseDragged: function(e) {
                    e.x -= this.size/2 | 0;
                    e.y -= this.size/2 | 0;
                    switch(this.draggedSection) {
                        case _HUE_SECTION:
                            _setHuePoint(this, e.x, e.y);
                            break;
                        case _SB_SECTION:
                            _setSBPoint(this, e.x, e.y);
                            break;
                        default:
                            return;
                    }
                }
            });
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
            _getSBAt = function(x, y, pts, adjust) {
                var div = 1.5*(pts[0].x*pts[0].x + pts[0].y*pts[0].y);
                var satTimesBri = (
                    (x + 0.5*pts[0].x) * pts[0].x +
                    (y + 0.5*pts[0].y) * pts[0].y
                ) / div;
                var bri = -(
                    (x -= pts[2].x) * pts[2].x +
                    (y -= pts[2].y) * pts[2].y
                ) / div;
                if(satTimesBri < 0) {
                    if(adjust) {
                        bri = pjs.constrain(bri - 0.5 * satTimesBri, 0, 1);
                        satTimesBri = 0;
                    } else { return; }
                } else if(bri > 1) {
                    if(adjust) {
                        satTimesBri -= 0.5 * (bri - 1);
                        bri = 1;
                        satTimesBri = pjs.constrain(satTimesBri, 0, 1);
                    } else { return; }
                } else if(satTimesBri > bri) {
                    if(adjust) {
                        var diff = 0.5 * (satTimesBri - bri);
                        satTimesBri = pjs.constrain(satTimesBri - diff, 0, 1);
                        bri = pjs.constrain(bri + diff, 0, 1);
                    } else { return; }
                }
                var sat = satTimesBri / bri || 0;
                return [255*sat, 255*bri];
            };
            _setHuePoint = function(clrPicker, x, y) {
                var angle = (pjs.atan2(-y, x) + 360) % 360;
                var hue = 17/24 * angle;
                clrPicker.setHSB(hue, clrPicker.hsb[1], clrPicker.hsb[2]);
            };
            _setSBPoint = function(clrPicker, x, y) {
                var halfSz = clrPicker.size/2 | 0;
                var trianglePts = _getTrianglePts(_R_TRIANGLE*halfSz, clrPicker.angle);
                var sb = _getSBAt(x, y, trianglePts, true);
                clrPicker.setHSB(clrPicker.hsb[0], sb[0], sb[1]);
            };
            _getSBPoint = function(clrPicker, trianglePts) {
                var sat = clrPicker.hsb[1] / 255;
                var bri = clrPicker.hsb[2] / 255;
                return {
                    x:  sat * bri * trianglePts[0].x +
                        (1-sat)*bri*trianglePts[1].x +
                        (1 - bri) * trianglePts[2].x,
                    y:  sat * bri * trianglePts[0].y +
                        (1-sat)*bri*trianglePts[1].y +
                        (1 - bri) * trianglePts[2].y
                };
            };
            return ColorPicker;
        })();
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
                            if(modifierKeys[pjs.SHIFT]) {
                                Component.focusPrevious();
                            } else {
                                Component.focusNext();
                            }
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
            
            var _layerProto;
            var _init, _toUserCoords, _drawAction, _dist;
            
            var Canvas = function(config) {
                config = config || {};
                Component.call(this, config);
                if(config.imageWidth ) { this.imageWidth  = config.imageWidth; }
                if(config.imageHeight) { this.imageHeight = config.imageHeight; }
                if(config.backgroundOuter)
                    { this.backgroundOuter = config.backgroundOuter; }
                _init(this);
            };
            Canvas.prototype = Object.assign(Object.create(Component.prototype), {
                imageWidth: 400,
                imageHeight: 400,
                background: pjs.color(255, 255, 255),
                backgroundOuter: pjs.color(63, 69, 87),
                tool: 'brush',
                color: pjs.color(0),
                alpha: 192,
                size: 10,
                blur: 2,
                currentLayer: -1,
                currentAction: -1,
                actionInProgress: false,
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
                mousePressed: function(e) {
                    e = _toUserCoords(this, e.x, e.y);
                    if(pjs.mouseButton === pjs.LEFT) {
                        var layer = this.layers[this.currentLayer];
                        if(!layer || !layer.isVisible) {
                            return;
                        }
                        var w = this.imageWidth;
                        var h = this.imageHeight;
                        switch(this.tool) {
                            case 'brush':
                                this.addAction({
                                    action: 'draw',
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
                            case 'eraser':
                                this.addAction({
                                    action: 'erase',
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
                addLayer: function(name) {
                    var layer = Object.assign(Object.create(_layerProto),{
                        name: name || "Layer " + this.layers.length,
                        index: ++this.currentLayer,
                        canvas: this,
                        graphics: Graphics.create(this.imageWidth, this.imageHeight)
                    });
                    this.layers.splice(layer.index, 0, layer);
                    this.addAction({
                        action: "add_layer",
                        name: layer.name,
                        index: layer.index
                    });
                    for(var i = layer.index + 1; i < this.layers.length; i++) {
                        this.layers[i].index = i;
                    }
                },
                addAction: function(action, inProgress) {
                    if(!this.actionInProgress) {
                        this.actions.splice(++this.currentAction);
                        this.actions.push(action);
                        this.actionInProgress = !!inProgress;
                    }
                }
            });
            
            _layerProto = {
                isVisible: true,
                setVisible: function(visible) {
                    if(visible !== this.isVisible) {
                        this.isVisible = visible;
                        this.canvas.addAction({
                            action: visible ? "show_layer" : "hide_layer",
                            index: this.index
                        });
                        this.canvas.needsRedraw = true;
                        Component.setChange();
                    }
                },
                isSelected: function() {
                    return this.canvas.currentLayer === this.index;
                },
                select: function() {
                    if(!this.isSelected()) {
                        this.canvas.currentLayer = this.index;
                        this.canvas.addAction({
                            action: "select_layer",
                            index: this.index
                        });
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
                        action: "swap_layers",
                        index1: that.index,
                        index2: this.index
                    });
                    canvas.needsRedraw = true;
                    return true;
                },
                remove: function() {
                    if(this.canvas.currentLayer >= this.index)
                        { this.canvas.currentLayer--; }
                    var layers = this.canvas.layers;
                    layers.splice(this.index, 1);
                    for(var i = this.index; i < layers.length; i++) {
                        layers[i].index = i;
                    }
                    this.canvas.addAction({
                        action: 'remove_layer',
                        index: this.index
                    });
                    this.index = -1;
                    this.canvas.needsRedraw = true;
                }
            };
            
            _init = function(canvas) {
                var margin = 4;
                var w = canvas.width;
                var h = canvas.height;
                var imgW = canvas.imageWidth;
                var imgH = canvas.imageHeight;
                var scale = pjs.min((w - 2*margin) / imgW, (h - 2*margin) / imgH);
                canvas.actions = [];
                canvas.layers = [];
                canvas.addLayer('Background');
                
                canvas.graphics.beginDraw();
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
                    x: (x - bounds.x)/canvas.scale,
                    y: (y - bounds.y)/canvas.scale
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
                    case 'draw':
                    case 'erase':
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
                                    if(action.action === 'draw') {
                                        color = action.color & 0xffffff;
                                        color |= alpha << 24;
                                    } else if(action.action === 'erase') {
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
                    case 'draw':
                        Graphics.image(graphics, g, 0, 0, 0, 0, action.alpha);
                        break;
                    case 'erase':
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
                    var bottom = this.height;
                    for(var i = 0; i < this.children.length - 3; i++) {
                        var comp = this.children[i];
                        top = pjs.min(top, comp.y);
                        bottom = pjs.max(bottom, comp.y + comp.height);
                    }
                    if(top !== this.top || bottom !== this.bottom) {
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
                if(active) {
                    var index = this.parent.layer.index;
                    this.parent.parent.select(index);
                }
            };
            _toggleShow = function(active) {
                this.parent.layer.setVisible(active);
            };
            _moveUp = function(active) {
                if(active) {
                    var layer = this.parent.layer;
                    layer.swap(layer.index + 1);
                    this.parent.parent.update();
                }
            };
            _moveDown = function(active) {
                if(active) {
                    var layer = this.parent.layer;
                    layer.swap(layer.index - 1);
                    this.parent.parent.update();
                }
            };
            _remove = function(active) {
                if(active) {
                    var layer = this.parent.layer;
                    layer.remove();
                    this.parent.parent.update();
                }
            };
            return LayerDetail;
        })();
        var LayerList = (function() {
            var _init, _addLayer, _calculateY, _updateArrangement;
            var LayerList = function(config) {
                config = config || {};
                Component.call(this, config);
                if(config.canvas)
                    { this.canvas = config.canvas; }
                _init(this);
            };
            LayerList.prototype = Object.assign(Object.create(Component.prototype), {
                update: function() {
                    var layers = this.canvas.layers;
                    var currLayer = layers[this.canvas.currentLayer];
                    var actions = this.canvas.actions;
                    var action = actions[this.canvas.currentAction];
                    switch(action.action) {
                        case 'add_layer':
                            _addLayer(this, currLayer, action.name);
                            break;
                        case 'swap_layers':
                            var comp1 = this.children[action.index1];
                            var comp2 = this.children[action.index2];
                            this.children[action.index1] = comp2;
                            this.children[action.index2] = comp1;
                            break;
                        case 'remove_layer':
                            this.removeChild(action.index);
                            break;
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
                select: function(index) {
                    if(this.selected) {
                        if(this.selected.layer.index === index)
                            { return; }
                        this.selected.needsRedraw = true;
                    }
                    this.selected = this.children[index];
                    this.selected.layer.select();
                    this.selected.needsRedraw = true;
                    Component.setChange();
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
            };
            _addLayer = function(list, layer) {
                new LayerDetail({
                    parent: list,
                    layer: layer
                });
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
                    if(i === selected)
                        { child.selectButton.setActive(true); }
                }
                var height = _calculateY(comp.children.length) - 1;
                comp.resize(comp.width, height);
            };
            return LayerList;
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
                            data1[i1  ] *= 1 - (1 - red2/255)*opacity;
                            data1[i1+1] *= 1 - (1 - grn2/255)*opacity;
                            data1[i1+2] *= 1 - (1 - blu2/255)*opacity;
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
            ButtonIcons.brush  = Button.createIcon(_drawBrushIcon);
            ButtonIcons.eraser = Button.createIcon(_drawEraserIcon);
            ButtonIcons.stroke = Button.createIcon(_drawStrokeIcon);
            ButtonIcons.layers = Button.createIcon(_drawLayersIcon);
            ButtonIcons.select = Button.createIcon(_drawSelectIcon);
            ButtonIcons.show   = Button.createIcon(_drawShowIcon);
            ButtonIcons.up     = Button.createIcon(_drawUpIcon);
            ButtonIcons.down   = Button.createIcon(_drawDownIcon);
            _color = Button.prototype.foregroundActive;
            ButtonIcons.brushActive  = Button.createIcon(_drawBrushIcon);
            ButtonIcons.eraserActive = Button.createIcon(_drawEraserIcon);
            ButtonIcons.strokeActive = Button.createIcon(_drawStrokeIcon);
            ButtonIcons.layersActive = Button.createIcon(_drawLayersIcon);
            ButtonIcons.selectActive = Button.createIcon(_drawSelectIcon);
            ButtonIcons.showActive   = Button.createIcon(_drawShowIcon);
            ButtonIcons.upActive     = Button.createIcon(_drawUpIcon);
            ButtonIcons.downActive   = Button.createIcon(_drawDownIcon);
            
            return ButtonIcons;
        })();
        
        var canvas, toolbar, colorPanel, strokePanel, layersPanel;
        
        canvas = new Canvas({
            y: 40,
            height: pjs.height - 40
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
                color: pjs.color(210, 247, 64),
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
                value: 10,
                onChange: function() {
                    canvas.size = this.value;
                    sizeInput.text = this.value.toFixed();
                }
            });
            var alphaSlider = new Slider({
                parent: strokePanel,
                x: sliderX,
                y: sliderY + dist,
                value: 255,
                max: 255,
                onChange: function() {
                    canvas.alpha = this.value;
                    alphaInput.text = this.value.toFixed();
                }
            });
            var blurSlider = new Slider({
                parent: strokePanel,
                x: sliderX,
                y: sliderY + 2*dist,
                value: 2,
                onChange: function() {
                    canvas.blur = this.value;
                    blurInput.text = this.value.toFixed();
                }
            });
            
            sizeInput .slider = sizeSlider;
            alphaInput.slider = alphaSlider;
            blurInput .slider = blurSlider;
            
            return strokePanel;
        })();
        layersPanel = (function() {
            
            var layersAdded = 1;
            
            var layersPanel = new Panel({
                x: pjs.width - 205,
                y: 40,
                width: 205,
                height: pjs.height - 40,
                hidden: true
            });
            
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
                text: "Layer 1"
            });
            var newLayerButton = new Button({
                parent: layersPanel,
                x: layersPanel.width - 40,
                y: 10,
                onToggle: function(active) {
                    if(active) {
                        canvas.addLayer(newLayerInput.text);
                        layerList.update();
                        newLayerInput.text = "Layer " + (++layersAdded);
                    }
                },
                icon: ButtonIcons.add
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
                isActive: true,
                onToggle: function(active) {
                    if(active)
                        { canvas.tool = 'brush'; }
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
                onToggle: function(active) {
                    if(active)
                        { canvas.tool = 'eraser'; }
                },
                icon: ButtonIcons.eraser,
                iconActive: ButtonIcons.eraserActive
            });
            
            var colorButton = new Button({
                parent: toolbar,
                x: pjs.width - 107,
                y: 3,
                buttonGroup: propertyButtons,
                clickBehavior: Button.TOGGLE,
                onToggle: function() {
                    if(this.isActive)
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
                x: pjs.width - 72,
                y: 3,
                buttonGroup: propertyButtons,
                clickBehavior: Button.TOGGLE,
                onToggle: function() {
                    if(this.isActive)
                        { strokePanel.show(); }
                    else
                        { strokePanel.hide(); }
                },
                icon: ButtonIcons.stroke,
                iconActive: ButtonIcons.strokeActive
            });
            var layersButton = new Button({
                parent: toolbar,
                x: pjs.width - 37,
                y: 3,
                buttonGroup: propertyButtons,
                clickBehavior: Button.TOGGLE,
                onToggle: function() {
                    if(this.isActive)
                        { layersPanel.show(); }
                    else
                        { layersPanel.hide(); }
                },
                icon: ButtonIcons.layers,
                iconActive: ButtonIcons.layersActive
            });
            
            return toolbar;
        })();
        
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
            if(comp && comp.keyPressed)
                { comp.keyPressed(); }
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
            if(!pjs.focused) {
                Component.clearFocus();
            }
            if(Component.hasChanges()) {
                Component.drawAll();
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