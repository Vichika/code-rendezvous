'use strict';
// Root Vue Instance
var app = new Vue({
    data: function () {
        return {
            languages: ["JavaScript", "Python", "Ruby", "Java", "PHP", "C/C++", "CSS"],
            selectedLanguage: 'JavaScript',
            locations: [],
            search: 'Santa Monica, Ca',
            resultsFilter: '',
            drawer: true,
            locationsFound: false,
            noLocationsFound: false,
            meetupError: false,
            meetupErrorMsg: ''
        }
    },
    methods: {
        triggerMarker: function (name) {
            var len = markers.length;
            for (var i=0; i<len; i++) {
                if (name == markers[i].name) {
                    google.maps.event.trigger(markers[i], 'click');
                }
            }
        },
        removeMarkers: function () {
            var len = markers.length;
            for (var i = 0; i < len; i++) {
                markers[i].setMap(null);
            }
        },
        resizeMap: function() {
            this.drawer = !this.drawer;
            setTimeout(function() {
                google.maps.event.trigger(map, 'resize')
            }, 200)
        },
        openMeetupPage: function(link) {
            window.open(link, '_blank');
            window.focus();
        },
        /**
         * @desc Grab data for markers, pop them on the map
         * @param {object} response retrieved from meetup api
         */
        handleMuResponse: function (responseObj) {
            var infowindow = new google.maps.InfoWindow();
            // reset locations if a previous search was done
            if (this.locations.length > 0) {
                this.locations = [];
                this.removeMarkers();
                markers = [];
            }
            if (responseObj.meta.status == 200) {
                this.locations = responseObj.data;
                if (this.locations.length > 0) {
                    this.locationsFound = true;
                    setTimeout(function() {
                        app.locationsFound = false;
                    }, 6000);
                }
                else {
                    this.noLocationsFound = true;
                    setTimeout(function() {
                        app.noLocationsFound = false;
                    }, 6000);
                }
               

                var bounds = new google.maps.LatLngBounds();
                this.locations.forEach(function (location, index, list) {
                    var marker;
                    // drop markers sequentially in an orderly fashion
                    setTimeout(function () {
                        var num = index + 1;
                        var pos = {
                            lat: location.lat,
                            lng: location.lon
                        };

                        var current_location = new google.maps.LatLng(pos.lat, pos.lng);
                        // set bound limits
                        bounds.extend(current_location);
                        
                        // configure new marker 
                        marker = new google.maps.Marker({
                            map: map,
                            name: location.name,
                            index: index,
                            position: pos,
                            draggable: true,
                            meetupID: location.id,
                            animation: google.maps.Animation.DROP
                        });
                       
                        // add to global markers array to keep track of all markers
                        markers.push(marker);
                        marker.addListener('click', function () {
                            infowindow.close();
                            if (location.key_photo !== undefined) {
                                infowindow.setContent('<div class="infowindow"><p><a href=' + location.link + ' target="_blank">' + location.name + '</p>' +
                                    '<img src=' + location.key_photo.thumb_link + '><br />'+'<p>'+location.description+'</p>');
                            } else {
                                infowindow.setContent('<div class="infowindow"><p><a href=' + location.link + ' target="_blank">' + location.name + '</p>'
                                +'<p>'+location.description+'</p>');
                            }

                            infowindow.open(map, marker);

                            // toggle marker bounce
                            if (marker.getAnimation() !== null) {
                                marker.setAnimation(null);
                            } else {
                                marker.setAnimation(google.maps.Animation.BOUNCE);
                                // stop bouncing after 2 secs
                                setTimeout(function () {
                                    marker.setAnimation(null);
                                }, 2100);
                            }
                        });

                    }, index * 150); // end of marker object and animation

                }); //end of locations loop
                map.panToBounds(bounds);
                // wait til all markers are loaded and page is idle before fitting bounds
                google.maps.event.addListenerOnce(map, 'idle', function () {
                    map.fitBounds(bounds);

                });
            } else {
                // response not successful 
                var status = responseObj.meta.status,
                    code = responseObj.data.errors[0].code,
                    msg = responseObj.data.errors[0].message;
                this.meetupError = true;
                this.meetupErrorMsg = msg;
                setTimeout(function() {
                    this.meetupError = false;
                }, 5000);

            }
        }, // end of handleMuResponse

        verifyIfLocationPicked: function() {
            if (!this.search) {
                 return;
            } else {
                this.getLocations();
            }
        },

        getLocations: function () {
            if (!this.search) {
                this.noLocation = true;
                return;
            }
            // note: meetup api does not respond properly if the url is broken into multiple lines, even using es6 template strings 
            var url = `https://api.meetup.com/find/groups/?&location=${this.search}&radius=10&topic_id=${this.getLangId}&key=${MEETUP_API_KEY}`
            // start vue_resource jsonp ajax call
            var options = {
                jsonp: 'callback'
            }
            this.$http.jsonp(url, options).then(function (data) {
                return data.json();
            }, function (error) {
                // handle errors
            }).then(function (payload) {
                app.handleMuResponse(payload);
            });
        }
    },

    computed: {
        getLangId: function () {
            switch (this.selectedLanguage) {
                case 'JavaScript':
                    return '7029';
                case 'Python':
                    return '1064';
                case 'Ruby':
                    return '1040';
                case 'Java':
                    return '189';
                case 'PHP':
                    return '455';
                case 'C/C++':
                    return '1327';
                case 'CSS':
                    return '1973';
                default:
                    return '7029';
            }
        },
        filteredLocations: function() {
           return this.locations.filter(function(location) {
                return location.name.toLowerCase().indexOf(app.resultsFilter.toLowerCase()) > -1;
            });
        }
    }

}).$mount('#app');