'use strict';
// Root Vue Instance
var app = new Vue({
    components: {

    },
    data: function () {
        return {
            languages: ["JavaScript", "Python", "Ruby", "Java", "PHP", "C/C++", "CSS"],
            selectedLanguage: 'JavaScript',
            locations: [],
            search: '',
            filter: '',
            drawer: true
        }
    },
    methods: {
        triggerMarker: function (marker_name) {
            var len = markers.length;
            for (var i = 0; i < len; i++) {
                if (marker_name === markers[i].name) {
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
        showAllMarkers: function () {
            var len = markers.length,
                counter = 0;
            while (counter < len) {
                markers[counter].setVisible(true);
                counter++;
            }
        },
        /**
         * @desc this method will be called to handle response from MeetUP
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
                var len = this.locations.length;
                if (len === 0) {
                    swal({
                        title: "Zero Results",
                        text: "Sorry, but this query didn't return any results. Please try again!",
                        type: "error",
                        confirmButtonText: "Try Again"
                    });
                }
                // if website just loaded, do not show sweet alert
                if (sessionStorage.notInitialLoad) {
                    swal({
                        title: "Request Successful",
                        text: "There were " + len + " results!",
                        type: "success",
                        confirmButtonText: "OK"
                    });
                } else {
                    sessionStorage.notInitialLoad = true;
                }

                var bounds = new google.maps.LatLngBounds();
                // console.log(bounds);
                this.locations.forEach(function (location, index, list) {
                    // console.log(location);
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
                        // can add single digit label if results are <= 9
                        if (list.length <= 9) {
                            marker = new google.maps.Marker({
                                map: map,
                                name: location.name,
                                index: index,
                                position: pos,
                                draggable: true,
                                meetupID: location.id,
                                animation: google.maps.Animation.DROP,
                                label: num.toString()

                            });
                        } else {
                            // marker without label because not readable if more than 9 results
                            marker = new google.maps.Marker({
                                map: map,
                                name: location.name,
                                index: index,
                                position: pos,
                                draggable: true,
                                meetupID: location.id,
                                animation: google.maps.Animation.DROP
                            });
                        }
                        // add to global markers array to keep track of all markers
                        markers.push(marker);
                        marker.addListener('click', function () {
                            infowindow.close();
                            if (location.key_photo !== undefined) {
                                infowindow.setContent('<div style="text-align:center"><h4><a href=' + location.link + ' target="_blank">' + location.name + '</h4>' +
                                    '<img src=' + location.key_photo.thumb_link + '><br />' +
                                    '<span>lat: ' + location.lat + ',  lon: ' + location.lon + '</span></div>');
                            } else {
                                infowindow.setContent('<div style="text-align:center"><h4><a href=' + location.link + ' target="_blank">' + location.name + '</h4>' +
                                    '<span>lat: ' + location.lat + ',  lon: ' + location.lon + '</span></div>');
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
                    console.log('map is idle');
                    map.fitBounds(bounds);

                });


            } else {
                // response not successful 
                var status = responseObj.meta.status,
                    code = responseObj.data.errors[0].code,
                    msg = responseObj.data.errors[0].message;

                swal({
                    title: "Request Error",
                    text: "Sorry, the server returned a status of " + status + ", the code is " + code + " due to " + msg,
                    type: "error"
                });
            }
        }, // end of handleMuResponse

        getLocations: function () {
            // note: meetup api does not respond properly if the url is broken into multiple lines, even using es6 template strings 
            var url = `https://api.meetup.com/find/groups/?&location=${this.search}&radius=10&topic_id=${this.getLangId}&key=17a7b116332318a3d35e162e335f&`
            console.log(url);
            // implement ajax call jsonp style, using vue resource
            var options = {
                jsonp: 'callback'
            }
            this.$http.jsonp(url, options).then(function (data) {
                return data.json();
            }, function (error) {
                // handle errors
            }).then(function (payload) {
                console.dir(payload);
                app.handleMuResponse(payload);
            });
        }
    },

    computed: {
        /**
         *  @desc used to map selected language to topic id for meetup api,
         *        topic ids can be found here https://secure.meetup.com/meetup_api/console/?path=/topics
         *  @return {string}
         */
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
        }
    }

}).$mount('#app');