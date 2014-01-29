dojo.require("dijit.form.Slider");
dojo.addOnLoad(function() {
                var vertical = dojo.byId("vertical");
                var rulesNode = document.createElement('div');
                vertical.appendChild(rulesNode);
                var sliderRules = new dijit.form.VerticalRule({
                    count: 6,
                    style: "width:5px;"
                },
                rulesNode);
                var slider = new dijit.form.VerticalSlider({
                    name: "vertical",
                    onChange:function(val){ sliderWithZoom(val); },
                    value: 1,
                    minimum: 0.3,
                    maximum: 1.7,
                    intermediateChanges: true,
                    style: "height:300px;"
                },
                vertical);	
            });

