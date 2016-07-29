'use strict';
//viewModel data
var mapData = [{
    name: 'North Carolina Museum of Natural Sciences',
    lat: 35.78,
    lng: -78.64,
    url: 'http://naturalsciences.org',
    address: '11 W Jones St',
    city: 'Raleigh, NC'
}, {
    name: 'Duke University',
    lat: 36.00,
    lng: -78.94,
    url: 'http://www.duke.edu',
    address: '2138 Campus Drive ',
    city: 'Durham, NC'
}, {
    name: 'University of North Carolina',
    lat: 35.95,
    lng: -79.01,
    url: 'http://www.unc.edu',
    address: '153A Country Club Road',
    city: 'Chapel Hill, NC'
}, {
    name: 'RDU international Airport',
    lat: 35.88,
    lng: -78.79,
    url: 'http://www.rdu.com',
    address: '2400 John Brantley Blvd',
    city: 'Morrisville, NC'
}, {
    name: 'NC State University',
    lat: 35.99,
    lng: -78.90,
    url: 'http://www.dpacnc.com',
    address: '123 Vivian Street',
    city: 'Durham, NC'
}];

function googleSuccess() {

    var viewModel = function() {
        var self = this,
            localLocation = {
                lat: 35.88,
                lng: -78.78
            },
            map;
        self.markerArray = ko.observableArray();
        self.wikiElem = ko.observableArray(null);
        self.wikiElem = ko.observableArray(['Please click a marker to get wikipedia links']);

        (function initMap() {
            map = new google.maps.Map(document.getElementById('map'), {
                center: localLocation,
                disableDefaultUI: true,
                zoom: 10
            });
            var markerData = mapData,
                point,
                name,
                infowindowData;
            for (var i = 0; i < mapData.length; i++) {
                point = new google.maps.LatLng(markerData[i].lat, markerData[i].lng);
                name = markerData[i].name;
                infowindowData = markerData[i];
                //console.log(markerData[i].city)
                addMarkers(point, name, infowindowData, i);
            }
        })(); //Self-Invoking Function
        var infowindow = new google.maps.InfoWindow();
        
        //add markers to map
        function addMarkers(point, name, infowindowData) {
                var marker = new google.maps.Marker({
                    position: point,
                    animation: google.maps.Animation.DROP,
                    title: name,
                    map: map
                });
                google.maps.event.addListener(marker, 'click', addinfoWindow(infowindowData, marker));
                //create obervable array of markers
                self.markerArray.push(marker);
            }
            
        //Add infowindow information to marker
        function addinfoWindow(infowindowData, marker) {
            return function() {
                //var wikiSearch = infowindowData.name;
                var streetViewImg =
                    'https://maps.googleapis.com/maps/api/streetview?size=180x90&location=' +
                    infowindowData.address + ',' + infowindowData.city;
                //get wikipedia links through an AJAX call
                getWiki(infowindowData);
                var content = '<img src="' + streetViewImg +
                    '" alt="Street View Image of ' +
                    infowindowData.name + '"><br>' + '<strong>' +
                    infowindowData.name + '</strong>' + '<br>' +
                    infowindowData.address + '<br>' +
                    infowindowData.city + '<br>' + '<a href="' +
                    infowindowData.url + '">' + infowindowData.url +
                    '</a>';
                infowindow.close();
                // update the content of the infowindow before opening it
                infowindow.setContent(content);
                infowindow.open(map, marker);
                toggleBounce(map, marker);
            };
        }
            
        //Animate marker when clicked
        function toggleBounce(map, marker) {
            if (marker.getAnimation() !== null) {
                marker.setAnimation(null);
            } else {
                marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function() {
                    marker.setAnimation(null);
                }, 1400);
            }
        }
        
        //AJAX request from wikipedia for links
        function getWiki(infowindowData) {
            self.wikiElem.removeAll();
            var searchWiki = infowindowData.name;
            var wikiUrl =
                'https://en.wikipedia.org/w/api.php?action=opensearch&search=' +
                searchWiki + '&format=json&callback=wikiCallback';
            // load wikipedia data
            console.log(wikiUrl);
            $.ajax({
                url: wikiUrl,
                dataType: 'jsonp'
                    // jsonp: "callback"
            }).done(function(response) {
                var articleList = response[1],
                    url,
                    articleStr;
                for (var i = 0; i < articleList.length; i++) {
                    articleStr = articleList[i];
                    url = 'http://en.wikipedia.org/wiki/' + articleStr;
                    self.wikiElem.push('<li><a href="' + url + '">' + articleStr + '</a></li>');
                    //console.log(self.wikiElem());
                }
            }).fail(function() {
                return self.wikiElem.push(
                    'Failed to get wikipedia resources!'
                );
            });
        }

        // centers map as window size changes
        google.maps.event.addDomListener(window, 'resize', function() {
            var center = map.getCenter();
            google.maps.event.trigger(map, 'resize');
            map.setCenter(center);
        });

        //filter list
        self.query = ko.observable('');

        //filter list by name
        self.filteredArray = ko.computed(function() {
            return ko.utils.arrayFilter(self.markerArray(),
                function(marker) {
                    return marker.title.toLowerCase().indexOf(self.query().toLowerCase()) !== -1;
                });
        }, self);

        //compare filter array to marker array to determine which markers should be visible 
        self.filteredArray.subscribe(function() {
            var compareArrays = ko.utils.compareArrays(self.markerArray(),
                self.filteredArray());
            ko.utils.arrayForEach(compareArrays, function(
                marker) {
                if (marker.status === 'deleted') {
                    marker.value.setMap(null);
                } else {
                    marker.value.setMap(map);
                }
            });
        });

        //if list item is clicked open infowindow
        self.selectItem = function(item) {
            google.maps.event.trigger(item, 'click');
        };
    };
    
    ko.applyBindings(new viewModel());
}

//google maps did not load message
function googleError() {
    $('#map').html(
        'Unable to load google maps, please check you connection');
}
// Slide out menu functions
function openNav() {
    document.getElementById('mySidenav').style.width = '250px';
    document.getElementById('map').style.marginLeft = '250px';
}

function closeNav() {
    document.getElementById('mySidenav').style.width = '0';
    document.getElementById('map').style.marginLeft = '0';
}

//creating modal to display wikipedia links
// Get the modal
var modal = document.getElementById('myModal');
// Get the button that opens the modal
var btn = document.getElementById('wiki');
// Get the <span> element that closes the modal
var span = document.getElementsByClassName('close')[0];
// When the user clicks the button, open the modal
btn.onclick = function() {
    modal.style.display = 'block';
};
// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = 'none';
};
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};