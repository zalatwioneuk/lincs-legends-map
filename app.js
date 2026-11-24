(function () {
  "use strict";

  var places = window.LINCS_LEGENDS || [];

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function watchControl(place) {
    if (place.videoUrl) {
      return (
        '<a class="btn" href="' +
        escapeHtml(place.videoUrl) +
        '" target="_blank" rel="noopener noreferrer">Watch the story</a>'
      );
    }
    return '<span class="btn btn-soon" aria-disabled="true">Coming soon</span>';
  }

  function cardInner(place, opts) {
    opts = opts || {};
    var featured = place.featured
      ? '<span class="featured-badge">Featured</span>'
      : "";
    var locate = opts.withLocate
      ? '<button class="locate-btn" type="button" data-locate="' +
        escapeHtml(place.id) +
        '">Show on the map</button>'
      : "";
    var num =
      typeof opts.index === "number"
        ? '<span class="place-num">' + (opts.index + 1) + "</span>"
        : "";
    return (
      '<p class="place-kicker">' +
      escapeHtml(place.subtitle || "Lincolnshire legend") +
      "</p>" +
      '<div class="place-card-top">' +
      "<h3>" +
      num +
      escapeHtml(place.name) +
      "</h3>" +
      featured +
      "</div>" +
      '<p class="place-town">Nearest town: ' +
      escapeHtml(place.nearestTown) +
      "</p>" +
      locate +
      '<p class="legend-tag">Legend, not proven fact</p>' +
      '<p class="place-copy">' +
      escapeHtml(place.description) +
      "</p>" +
      watchControl(place)
    );
  }

  function renderList(listEl) {
    listEl.innerHTML = "";
    places.forEach(function (place, index) {
      var item = document.createElement("li");
      var article = document.createElement("article");
      article.className = "place-card" + (place.featured ? " is-featured" : "");
      article.id = "place-" + place.id;
      article.setAttribute("data-place-id", place.id);
      article.setAttribute("aria-label", place.name);
      article.innerHTML = cardInner(place, { withLocate: true, index: index });
      item.appendChild(article);
      listEl.appendChild(item);
      article.style.animationDelay = index * 40 + "ms";
    });
  }

  function setActivePlace(id) {
    document.querySelectorAll(".place-card").forEach(function (card) {
      card.classList.toggle("is-active", card.getAttribute("data-place-id") === id);
    });
    document.querySelectorAll(".legend-pin").forEach(function (pin) {
      pin.classList.toggle(
        "is-active",
        pin.classList.contains("pin--" + id) ||
          pin.getAttribute("data-place-id") === id
      );
    });
  }

  function initMap(listEl) {
    if (typeof L === "undefined") {
      return null;
    }

    var map = L.map("map", {
      scrollWheelZoom: true,
      zoomControl: true
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var bounds = L.latLngBounds([]);
    var markersById = {};

    places.forEach(function (place, index) {
      var icon = L.divIcon({
        className:
          "legend-pin pin--" +
          place.id +
          (place.featured ? " is-featured" : "") +
          (place.videoUrl ? "" : " is-soon"),
        html:
          '<div class="pin" data-place-id="' +
          escapeHtml(place.id) +
          '">' +
          (index + 1) +
          "</div>",
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16]
      });

      var marker = L.marker([place.lat, place.lng], {
        icon: icon,
        title: place.name,
        alt: place.name
      }).addTo(map);

      var markerEl = marker.getElement();
      if (markerEl) markerEl.setAttribute("data-place-id", place.id);

      marker.bindPopup(
        '<div class="popup-card">' + cardInner(place, { index: index }) + "</div>",
        { maxWidth: 300, className: "legend-popup" }
      );

      marker.on("click", function () {
        setActivePlace(place.id);
      });

      markersById[place.id] = marker;
      bounds.extend([place.lat, place.lng]);
    });

    if (bounds.isValid()) {
      var narrow = window.innerWidth < 600;
      map.fitBounds(bounds, {
        padding: narrow ? [44, 40] : [64, 88],
        maxZoom: narrow ? 9 : 10
      });
    } else {
      map.setView([53.15, -0.25], 9);
    }

    function openPlace(id, scrollList) {
      var place = places.find(function (item) {
        return item.id === id;
      });
      var marker = markersById[id];
      if (!place || !marker) return;
      setActivePlace(id);
      map.flyTo([place.lat, place.lng], Math.max(map.getZoom(), 11), {
        duration: 0.7
      });
      marker.openPopup();
      if (scrollList) {
        var card = document.getElementById("place-" + id);
        if (card) {
          card.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
      }
    }

    listEl.addEventListener("click", function (event) {
      var button = event.target.closest("[data-locate]");
      if (!button) return;
      event.preventDefault();
      var id = button.getAttribute("data-locate");
      var mapEl = document.getElementById("map");
      if (mapEl) {
        mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      openPlace(id, false);
    });

    return { map: map, openPlace: openPlace, markersById: markersById };
  }

  function init() {
    var listEl = document.getElementById("place-list");
    if (!listEl) return;
    renderList(listEl);
    initMap(listEl);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
