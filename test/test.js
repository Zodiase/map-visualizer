describe.skip('simple test', function(){

    before('set up url', function(){
        browser.url('/');
    });

    describe('Check homepage when first loaded', function(){

        it('should see the correct title', function() {

            var title = browser.getTitle();
            expect(title).to.equal('Visualize');

        });

        it('should have map with the size same as viewport', function(){
            var viewportHeight = browser.getViewportSize('height');
            var viewportWidth = browser.getViewportSize('width');
            expect(browser.getElementSize('#map', 'width')).to.equal(viewportWidth);
            expect(browser.getElementSize('#map', 'height')).to.equal(viewportHeight);
        });

        it('should have list hidden', function(){
            expect(browser.isExisting('#map .ol-viewport')).to.equal(true);
            expect(browser.isExisting('#map .ol-viewport .layer-list')).to.equal(true);
            expect(browser.getCssProperty('.layer-list', 'width').value).to.equal('0px');
        });

    });

    describe('should have layers button work noramally', function(){

        var button = '.layer-list__toggle button';

        it('should have "layer" in text', function(){
            expect(browser.getText(button)).to.equal('layers');
        });

        it('should span the list when click', function(){
            browser.click(button);
            browser.waitForVisible('#map .layer-list--expanded', 5000);
            browser.pause(1000);
            expect(browser.getElementSize('.layer-list', 'width')).to.equal(300);

        });

        it('should have list hidden when click again', function(){
            browser.click(button);
            browser.waitForVisible('#map .layer-list--expanded', 5000, true);
            browser.pause(1000);
            expect(browser.getElementSize('.layer-list', 'width')).to.equal(0);
        });

    });

});

describe('source loading', function(){

    describe.skip('source file', function(){

        describe('url', function(){

            it('should notify when no source file url included', function(){
                browser.reseturl('/#source=');
                browser.pause(300);
                browser.notificationContains('No source url available.');
                browser.waitELementDisappeared('.layer-list__body .layerlist__item');
            });

            it('should notifying user when no source url available', function(){
                browser.log('browser');
                browser.reseturl('/');
                browser.pause(300);
                browser.notificationContains('No source url available.');
            });

            //test will fail for this case now, need to change code
            it('should have list renewed when url changed');

        });

        describe('file data', function(){

            it('should catch error when invalid json file format included', function(){
                browser.reseturl('/#source=https://raw.githubusercontent.com/Zodiase/map-visualizer/gh-pages/sample-source/invalid-json.json');
                browser.pause(300);
                browser.notificationContains('Downloading source file...');
                var lastText = browser.getLastNotification();
                expect(lastText).to.contain('parsererror, SyntaxError: ');
                browser.waitELementDisappeared('.layer-list__body .layerlist__item');
            });

            it('should give correct data layer list when include a right format json file', function(){
                browser.reseturl("/#source=https://raw.githubusercontent.com/Zodiase/map-visualizer/gh-pages/sample-source/two-layers.json");
                browser.waitForExist('.layer-list__item-row');
                var obj_length = browser.execute(function(){
                    return window.__app.viewer_.map_.getLayers().getArray().length;
                });
                expect(obj_length.value).to.equal(2);
            });

        });
    });

    describe('config string', function(){

        describe.skip('opacity test', function(){

            it('should change config string when opacity silder changed by user', function(){
                browser.reseturl("/#source=https://raw.githubusercontent.com/Zodiase/map-visualizer/gh-pages/sample-source/two-layers.json");
                browser.waitForExist('.layer-list__toggle button');
                browser.click('.layer-list__toggle button');
                browser.waitForExist('.layer-list__item');
                var items = browser.elements('.layer-list__item');
                items.value.forEach(function(item, index){
                    var curr_ind = index+1;
                    var curr_row = '.layer-list__item:nth-child('+curr_ind+')';
                    var curr_button = curr_row+' .layer-list__item__action-opacity';
                    expect(browser.isExisting(curr_button)).to.equal(true);
                    var slider = curr_row+ ' .layer-list__item-row__input';
                    expect(browser.isExisting(slider)).to.equal(true);
                    browser.slide(curr_button, slider);
                });

                expect(browser.getUrl()).to.equal('http://localhost:4000/#source=https%3A%2F%2Fraw.githubusercontent.com%2FZodiase%2Fmap-visualizer%2Fgh-pages%2Fsample-source%2Ftwo-layers.json&config=mapquest___0_1_0.55_-_osm___0_1_0.55');

            });

            it('should have slider changed to 1 when config string set to value larger than 1 in url', function(){
                browser.reseturl('/#source=https%3A%2F%2Fraw.githubusercontent.com%2FZodiase%2Fmap-visualizer%2Fgh-pages%2Fsample-source%2Ftwo-layers.json&config=mapquest___1_1_2.0_-_osm___0_1_0.55');
                var slider1 = '.layer-list__item:nth-child(1) .layer-list__item-row__input';
                var slider2 = '.layer-list__item:nth-child(2) .layer-list__item-row__input';
                browser.waitForExist(slider1);
                browser.waitForExist(slider2);
                expect(browser.isExisting(slider1)).to.equal(true);
                expect(browser.isExisting(slider2)).to.equal(true);
                expect(browser.getValue(slider1)).to.equal('100');
                expect(browser.getValue(slider2)).to.equal('55');
            });

            it('should have slider changed to 0 when config string set to value smaller than 0 in url', function(){
                browser.reseturl('/#source=https%3A%2F%2Fraw.githubusercontent.com%2FZodiase%2Fmap-visualizer%2Fgh-pages%2Fsample-source%2Ftwo-layers.json&config=mapquest___1_1_-1_-_osm___0_1_0.55');
                var slider1 = '.layer-list__item:nth-child(1) .layer-list__item-row__input';
                var slider2 = '.layer-list__item:nth-child(2) .layer-list__item-row__input';
                browser.waitForExist(slider1);
                browser.waitForExist(slider2);
                expect(browser.isExisting(slider1)).to.equal(true);
                expect(browser.isExisting(slider2)).to.equal(true);
                expect(browser.getValue(slider1)).to.equal('10');
                expect(browser.getValue(slider2)).to.equal('55');
            });

            it('should change opacity of layer object when config string is changed in url', function(){
                browser.reseturl("/#source=https://raw.githubusercontent.com/Zodiase/map-visualizer/gh-pages/sample-source/two-layers.json");
                browser.waitForExist('.layer-list__item-row');
                var op_obj = browser.execute(function(){
                    opacity1 = window.__app.viewer_.map_.getLayers().item(0).get('opacity');
                    opacity2 =window.__app.viewer_.map_.getLayers().item(1).get('opacity');
                    return opacity = {
                        op1: opacity1,
                        op2: opacity2
                    }
                });
                expect(op_obj.value.op1).to.equal(0.1);
                expect(op_obj.value.op2).to.equal(0.1);

            });

        });

        describe('layer order test', function(){

            it('should change the layer order in list when user click arrow', function(){
                browser.reseturl("/#source=https://raw.githubusercontent.com/Zodiase/map-visualizer/gh-pages/sample-source/two-layers.json");
                browser.waitForExist('.layer-list__toggle button');
                var button = '.layer-list__toggle button';
                browser.click(button);
                browser.saveScreenshot('after toggle');

                var row1 = '.layer-list__item:nth-child(1) .layer-list__item-row';
                var row1_up = row1 + ' .layer-list__item__action-promote';
                browser.waitForExist(row1);
                var original_label = browser.getAttribute('.layer-list__item:nth-child(1)', 'data-layer-id');
                browser.saveScreenshot('before click');
                browser.moveToObject(row1).moveToObject(row1_up).click(row1_up);
                //browser.waitForVisible(row1_up, 5000);
                //browser.click(row1_up);
                expect(browser.getAttribute('.layer-list__item:nth-child(1)', 'data-layer-id')).to.equal(original_label);

                var second_label = browser.getAttribute('.layer-list__item:nth-child(2)', 'data-layer-id');
                var row1_down = row1 + ' .layer-list__item__action-demote';
                var original_label = browser.getAttribute('.layer-list__item:nth-child(1)', 'data-layer-id');
                browser.click(row1_down);
                expect(browser.getAttribute('.layer-list__item:nth-child(1)', 'data-layer-id')).to.equal(second_label);

                var row2 = '.layer-list__item:nth-child(2) .layer-list__item-row';
                var original_label2 = browser.getAttribute('.layer-list__item:nth-child(2)', 'data-layer-id');
                var row2_down = row2 + ' .layer-list__item__action-demote';
                browser.moveToObject(row2);
                browser.waitForVisible(row2_down, 5000);
                browser.click(row2_down);
                expect(browser.getAttribute('.layer-list__item:nth-child(2)', 'data-layer-id')).to.equal(original_label2);
                browser.click(button);

            });

            it.skip('should change the config string when layer order changed', function(){
                browser.reseturl("/#source=https://raw.githubusercontent.com/Zodiase/map-visualizer/gh-pages/sample-source/two-layers.json");
                browser.waitForExist('.layer-list__toggle button');
                var button = '.layer-list__toggle button';
                browser.click(button);
                var row1 = '.layer-list__item:nth-child(1) .layer-list__item-row';
                browser.waitForExist(row1);
                browser.moveToObject(row1);
                var row1_down = row1 + ' .layer-list__item__action-demote';
                browser.waitForVisible(row1_down, 5000);
                browser.click(row1_down);
                browser.pause(1000);
                var url = browser.getUrl();
                expect(url).to.equal('http://localhost:4000/#source=https%3A%2F%2Fraw.githubusercontent.com%2FZodiase%2Fmap-visualizer%2Fgh-pages%2Fsample-source%2Ftwo-layers.json&config=mapquest___0_1_0.1_-_osm___1_1_0.1');
                browser.click(button);
            });
            it.skip('should not change layer order when trying to move the top layer up or bottom layer down', function(){
                browser.reseturl("/#source=https://raw.githubusercontent.com/Zodiase/map-visualizer/gh-pages/sample-source/two-layers.json");
                browser.waitForExist('.layer-list__toggle button');
                var button = '.layer-list__toggle button';
                browser.click(button);
                var row1 = '.layer-list__item:nth-child(1) .layer-list__item-row';
                var row1_up = row1 + ' .layer-list__item__action-promote';
                browser.waitForExist(row1);
                var original_label = browser.getAttribute('.layer-list__item:nth-child(1)', 'data-layer-id');
                browser.moveToObject(row1);
                browser.waitForVisible(row1_up, 5000);
                browser.click(row1_up);
                expect(browser.getAttribute('.layer-list__item:nth-child(1)', 'data-layer-id')).to.equal(original_label);

                var row2 = '.layer-list__item:nth-child(2) .layer-list__item-row';
                var original_label2 = browser.getAttribute('.layer-list__item:nth-child(2)', 'data-layer-id');
                var row2_down = row2 + ' .layer-list__item__action-demote';
                browser.moveToObject(row2);
                browser.waitForVisible(row2_down, 5000);
                browser.click(row2_down);
                expect(browser.getAttribute('.layer-list__item:nth-child(2)', 'data-layer-id')).to.equal(original_label2);
                browser.click(button);
            });
            it.skip('should see the correct layer order when config string include the order', function(){
                browser.reseturl("/#source=https://raw.githubusercontent.com/Zodiase/map-visualizer/gh-pages/sample-source/two-layers.json");
                browser.waitForExist('.layer-list__item');
                var row1_label = browser.getAttribute('.layer-list__item:nth-child(1)', 'data-layer-id');
                var row2_label = browser.getAttribute('.layer-list__item:nth-child(2)', 'data-layer-id');
                var location_hash = "http://localhost:4000/#source=https%3A%2F%2Fraw.githubusercontent.com%2FZodiase%2Fmap-visualizer%2Fgh-pages%2Fsample-source%2Ftwo-layers.json&config=mapquest___0_1_0.1_-_osm___1_1_0.1";
                browser.url(location_hash);
                browser.waitForExist('.layer-list__item');
                var new_row1_label = browser.getAttribute('.layer-list__item:nth-child(1)', 'data-layer-id');
                var new_row2_label = browser.getAttribute('.layer-list__item:nth-child(2)', 'data-layer-id');
                expect(row1_label).to.equal(new_row2_label);
                expect(row2_label).to.equal(new_row1_label);
            });
            //case when giving an invalid number as order
        });
        describe.skip('visible test', function(){
            it('should add layer-list__item--hidden class when click the hidden button', function(){
                browser.reseturl("/#source=https://raw.githubusercontent.com/Zodiase/map-visualizer/gh-pages/sample-source/two-layers.json");
                browser.waitForExist('.layer-list__toggle button');
                var button = '.layer-list__toggle button';
                browser.click(button);
                var row1 = '.layer-list__item:nth-child(1) .layer-list__item-row';
                browser.waitForExist(row1);
                browser.moveToObject(row1);
                var row1_visible = row1 + " .layer-list__item__action-hide";
                browser.waitForVisible(row1_visible, 5000);
                browser.click(row1_visible);
                expect(browser.getAttribute('.layer-list__item:nth-child(1)','class')).to.equal('layer-list__item layer-list__item--hidden');
                browser.click(button);

            });
            it('should see the config string changed when click the hidden button', function(){
                browser.reseturl("/#source=https://raw.githubusercontent.com/Zodiase/map-visualizer/gh-pages/sample-source/two-layers.json");
                browser.waitForExist('.layer-list__toggle button');
                var button = '.layer-list__toggle button';
                browser.click(button);
                var row2 = '.layer-list__item:nth-child(2) .layer-list__item-row';
                browser.waitForExist(row2);
                browser.moveToObject(row2);
                var row2_visible = row2 + " .layer-list__item__action-hide";
                browser.waitForVisible(row2_visible, 5000);
                browser.click(row2_visible);
                expect(browser.getUrl()).to.equal('http://localhost:4000/#source=https%3A%2F%2Fraw.githubusercontent.com%2FZodiase%2Fmap-visualizer%2Fgh-pages%2Fsample-source%2Ftwo-layers.json&config=mapquest___0_1_0.1_-_osm___0_0_0.1');
                browser.click(button);
            });
            it('should add layer-list__item--hidden class when config string changed', function(){
                browser.reseturl("http://localhost:4000/#source=https%3A%2F%2Fraw.githubusercontent.com%2FZodiase%2Fmap-visualizer%2Fgh-pages%2Fsample-source%2Ftwo-layers.json&config=mapquest___0_0_0.1_-_osm___1_0_0.1");
                browser.waitForExist('.layer-list__item-row');
                var vis_obj = browser.execute(function(){
                    visible1 = window.__app.viewer_.map_.getLayers().item(0).get('visible');
                    visible2 = window.__app.viewer_.map_.getLayers().item(1).get('visible');
                    return visible = {
                        vis1: visible1,
                        vis2: visible2
                    }
                });
                expect(vis_obj.value.vis1).to.equal(false);
                expect(vis_obj.value.vis2).to.equal(false);
            });
        });
    });
    describe.skip('extent string', function(){
        it('should follow extent set by url if any', function(){
            var location_hash = "/#source=https://raw.githubusercontent.com/Zodiase/map-visualizer/gh-pages/sample-source/tiled-arcgis.json&extent=-100_15_-40_50";
            browser.url(location_hash);
            browser.pause(1000); // to be deleted?
            var extUrl = [-100, 15, -40, 50];
            var absCenter = [(extUrl[0]+extUrl[2])/2, (extUrl[1]+extUrl[3])/2];
            var browserExtent = browser.execute(function() {
                return window.__app.viewer_.map_.getView().calculateExtent(window.__app.viewer_.map_.getSize());
            });
            //browser should contain the desired view
            expect(extUrl[0]>=browserExtent.value[0]);
            expect(extUrl[2]<=browserExtent.value[2]);
            expect(extUrl[1]>=browserExtent.value[1]);
            expect(extUrl[3]<=browserExtent.value[3]);

            var center = browser.execute(function(){
                return window.__app.viewer_.map_.getView().getCenter();
            });
            expect(center.value).to.deep.equal(absCenter);
        });

        it('should switch back to extent setting in src file if delete extent from url', function(){
            var location_hash = "/#source=https://raw.githubusercontent.com/Zodiase/map-visualizer/gh-pages/sample-source/tiled-arcgis.json";
            browser.url(location_hash);
            browser.pause(1000); // to be deleted?
            var extUrl = [-129.19921874999997, 20.9203969139719, -62.402343749999986, 52.829320910313726];
            var absCenter = [(extUrl[0]+extUrl[2])/2, (extUrl[1]+extUrl[3])/2];
            var browserExtent = browser.execute(function() {
                return window.__app.viewer_.map_.getView().calculateExtent(window.__app.viewer_.map_.getSize());
            });
            //browser should contain the desired view
            expect(extUrl[0]>=browserExtent.value[0]);
            expect(extUrl[2]<=browserExtent.value[2]);
            expect(extUrl[1]>=browserExtent.value[1]);
            expect(extUrl[3]<=browserExtent.value[3]);

            var center = browser.execute(function(){
                return window.__app.viewer_.map_.getView().getCenter();
            });
            expect(center.value).to.deep.equal(absCenter);
        });
        it('should catch error when extent string contains invalid data', function(){

        });
    });

    after(function(done) {
        browser.call(done);
    });
});
