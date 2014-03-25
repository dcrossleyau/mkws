/*! MKWS, the MasterKey Widget Set.
 *  Copyright (C) 2013-2014 Index Data
 *  See the file LICENSE for details
 */

"use strict"; // HTML5: disable for log_level >= 2


// Handlebars helpers
Handlebars.registerHelper('json', function(obj) {
    return $.toJSON(obj);
});


Handlebars.registerHelper('translate', function(s) {
    return mkws.M(s);
});


// We need {{attr '@name'}} because Handlebars can't parse {{@name}}
Handlebars.registerHelper('attr', function(attrName) {
    return this[attrName];
});


/*
 * Use as follows: {{#if-any NAME1 having="NAME2"}}
 * Applicable when NAME1 is the name of an array
 * The guarded code runs only if at least one element of the NAME1
 * array has a subelement called NAME2.
 */
Handlebars.registerHelper('if-any', function(items, options) {
    var having = options.hash.having;
    for (var i in items) {
	var item = items[i]
	if (!having || item[having]) {
	    return options.fn(this);
	}
    }
    return "";
});


Handlebars.registerHelper('first', function(items, options) {
    var having = options.hash.having;
    for (var i in items) {
	var item = items[i]
	if (!having || item[having]) {
	    return options.fn(item);
	}
    }
    return "";
});


Handlebars.registerHelper('commaList', function(items, options) {
    var out = "";

    for (var i in items) {
	if (i > 0) out += ", ";
	out += options.fn(items[i])
    }

    return out;
});


Handlebars.registerHelper('index1', function(obj) {
    return obj.data.index + 1;
});



// Set up global mkws object. Contains truly global state such as SP
// authentication, and a hash of team objects, indexed by team-name.
//
var mkws = {
    authenticated: false,
    log_level: 1, // Will be overridden from mkws_config, but
                  // initial value allows jQuery popup to use logging.
    paz: undefined, // will be set up during initialisation
    teams: {},
    locale_lang: {
	"de": {
	    "Authors": "Autoren",
	    "Subjects": "Schlagw&ouml;rter",
	    "Sources": "Daten und Quellen",
	    "source": "datenquelle",
	    "Termlists": "Termlisten",
	    "Next": "Weiter",
	    "Prev": "Zur&uuml;ck",
	    "Search": "Suche",
	    "Sort by": "Sortieren nach",
	    "and show": "und zeige",
	    "per page": "pro Seite",
	    "Displaying": "Zeige",
	    "to": "von",
	    "of": "aus",
	    "found": "gefunden",
	    "Title": "Titel",
	    "Author": "Autor",
	    "author": "autor",
	    "Date": "Datum",
	    "Subject": "Schlagwort",
	    "subject": "schlagwort",
	    "Location": "Ort",
	    "Records": "Datens&auml;tze",
	    "Targets": "Datenbanken",

	    "dummy": "dummy"
	},

	"da": {
	    "Authors": "Forfattere",
	    "Subjects": "Emner",
	    "Sources": "Kilder",
	    "source": "kilder",
	    "Termlists": "Termlists",
	    "Next": "N&aelig;ste",
	    "Prev": "Forrige",
	    "Search": "S&oslash;g",
	    "Sort by": "Sorter efter",
	    "and show": "og vis",
	    "per page": "per side",
	    "Displaying": "Viser",
	    "to": "til",
	    "of": "ud af",
	    "found": "fandt",
	    "Title": "Title",
	    "Author": "Forfatter",
	    "author": "forfatter",
	    "Date": "Dato",
	    "Subject": "Emneord",
	    "subject": "emneord",
	    "Location": "Lokation",
	    "Records": "Poster",
	    "Targets": "Baser",

	    "dummy": "dummy"
	}
    }
};


// Define empty mkws_config for simple applications that don't define it.
if (mkws_config == null || typeof mkws_config != 'object') {
    var mkws_config = {};
}


// Factory function for widget objects.
function widget($, team, type, node) {
    var that = {
	team: team,
	type: type,
	node: node
    };

    var M = mkws.M;

    var type2fn = {
	Targets: promoteTargets,
	Stat: promoteStat,
	Termlists: promoteTermlists,
	Pager: promotePager,
	Records: promoteRecords,
	Navi: promoteNavi,
	Sort: promoteSort,
	Perpage: promotePerpage
    };

    var promote = type2fn[type];
    if (promote) {
	promote();
	log("made " + type + " widget(node=" + node + ")");
    } else {
	log("made UNENCAPSULATED widget(type=" + type + ", node=" + node + ")");
    }

    return that;


    function log(s) {
	team.log(s);
    }

    // Functions follow for promoting the regular widget object into
    // widgets of specific types. These could be moved outside of the
    // widget object, or even into their own source files.

    function promoteTargets() {
	team.queue("targets").subscribe(function(data) {
	    var table ='<table><thead><tr>' +
		'<td>' + M('Target ID') + '</td>' +
		'<td>' + M('Hits') + '</td>' +
		'<td>' + M('Diags') + '</td>' +
		'<td>' + M('Records') + '</td>' +
		'<td>' + M('State') + '</td>' +
		'</tr></thead><tbody>';

	    for (var i = 0; i < data.length; i++) {
		table += "<tr><td>" + data[i].id +
		    "</td><td>" + data[i].hits +
		    "</td><td>" + data[i].diagnostic +
		    "</td><td>" + data[i].records +
		    "</td><td>" + data[i].state + "</td></tr>";
	    }
	    
	    table += '</tbody></table>';
	    var subnode = $(node).children('.mkwsBytarget');
	    subnode.html(table);
	});
    }


    function promoteStat() {
	team.queue("stat").subscribe(function(data) {
	    if (node.length === 0)  alert("huh?!");

	    $(node).html('<span class="head">' + M('Status info') + '</span>' +
		' -- ' +
		'<span class="clients">' + M('Active clients') + ': ' + data.activeclients + '/' + data.clients + '</span>' +
		' -- ' +
		'<span class="records">' + M('Retrieved records') + ': ' + data.records + '/' + data.hits + '</span>');
	});
    }


    function promoteTermlists() {
	team.queue("termlists").subscribe(function(data) {
	    if (!node) {
		alert("termlists event when there are no termlists");
		return;
	    }

	    // no facets: this should never happen
	    if (!mkws_config.facets || mkws_config.facets.length == 0) {
		alert("onTerm called even though we have no facets: " + $.toJSON(data));
		$(node).hide();
		return;
	    }

	    // display if we first got results
	    $(node).show();

	    var acc = [];
	    acc.push('<div class="title">' + M('Termlists') + '</div>');
	    var facets = mkws_config.facets;

	    for (var i = 0; i < facets.length; i++) {
		if (facets[i] == "xtargets") {
		    addSingleFacet(acc, "Sources",  data.xtargets, 16, null);
		} else if (facets[i] == "subject") {
		    addSingleFacet(acc, "Subjects", data.subject,  10, "subject");
		} else if (facets[i] == "author") {
		    addSingleFacet(acc, "Authors",  data.author,   10, "author");
		} else {
		    alert("bad facet configuration: '" + facets[i] + "'");
		}
	    }

	    $(node).html(acc.join(''));

	    function addSingleFacet(acc, caption, data, max, pzIndex) {
		acc.push('<div class="facet mkwsFacet' + caption + ' mkwsTeam_' + team.name() + '">');
		acc.push('<div class="termtitle">' + M(caption) + '</div>');
		for (var i = 0; i < data.length && i < max; i++) {
		    acc.push('<div class="term">');
		    acc.push('<a href="#" ');
		    var action = '';
		    if (!pzIndex) {
			// Special case: target selection
			acc.push('target_id='+data[i].id+' ');
			if (!team.targetFiltered(data[i].id)) {
			    action = 'mkws.limitTarget(\'' + team.name() + '\', this.getAttribute(\'target_id\'),this.firstChild.nodeValue)';
			}
		    } else {
			action = 'mkws.limitQuery(\'' + team.name() + '\', \'' + pzIndex + '\', this.firstChild.nodeValue)';
		    }
		    acc.push('onclick="' + action + ';return false;">' + data[i].name + '</a>'
			     + ' <span>' + data[i].freq + '</span>');
		    acc.push('</div>');
		}
		acc.push('</div>');
	    }
	});
    }


    function promotePager() {
	team.queue("pager").subscribe(function(data) {
	    $(node).html(drawPager(data))

	    function drawPager(data) {
		var s = '<div style="float: right">' + M('Displaying') + ': '
		    + (data.start + 1) + ' ' + M('to') + ' ' + (data.start + data.num) +
		    ' ' + M('of') + ' ' + data.merged + ' (' + M('found') + ': '
		    + data.total + ')</div>';

		//client indexes pages from 1 but pz2 from 0
		var onsides = 6;
		var pages = Math.ceil(team.totalRecordCount() / team.perpage());
		var currentPage = team.currentPage();

		var firstClkbl = (currentPage - onsides > 0)
		    ? currentPage - onsides
		    : 1;

		var lastClkbl = firstClkbl + 2*onsides < pages
		    ? firstClkbl + 2*onsides
		    : pages;

		var prev = '<span class="mkwsPrev">&#60;&#60; ' + M('Prev') + '</span><b> | </b>';
		if (currentPage > 1)
		    prev = '<a href="#" class="mkwsPrev" onclick="mkws.pagerPrev(\'' + team.name() + '\');">'
		    +'&#60;&#60; ' + M('Prev') + '</a><b> | </b>';

		var middle = '';
		for(var i = firstClkbl; i <= lastClkbl; i++) {
		    var numLabel = i;
		    if(i == currentPage)
			numLabel = '<b>' + i + '</b>';

		    middle += '<a href="#" onclick="mkws.showPage(\'' + team.name() + '\', ' + i + ')"> '
			+ numLabel + ' </a>';
		}

		var next = '<b> | </b><span class="mkwsNext">' + M('Next') + ' &#62;&#62;</span>';
		if (pages - currentPage > 0)
		    next = '<b> | </b><a href="#" class="mkwsNext" onclick="mkws.pagerNext(\'' + team.name() + '\')">'
		    + M('Next') + ' &#62;&#62;</a>';

		var predots = '';
		if (firstClkbl > 1)
		    predots = '...';

		var postdots = '';
		if (lastClkbl < pages)
		    postdots = '...';

		s += '<div style="float: clear">'
		    + prev + predots + middle + postdots + next + '</div>';

		return s;
	    }
	});
    }			     


    function promoteRecords() {
	team.queue("records").subscribe(function(data) {
	    var html = [];
	    for (var i = 0; i < data.hits.length; i++) {
		var hit = data.hits[i];
		var divId = team.recordElementId(hit.recid[0]);
		html.push('<div class="record mkwsTeam_' + team.name() + ' ' + divId + '">', renderSummary(hit), '</div>');
		// ### At some point, we may be able to move the
		// m_currentRecordId and m_currentRecordData members
		// from the team object into this widget.
		if (hit.recid == team.currentRecordId()) {
		    if (team.currentRecordData())
			html.push(team.renderDetails(team.currentRecordData()));
		}
	    }
	    $(node).html(html.join(''));

	    function renderSummary(hit)
	    {
		var template = team.loadTemplate("Summary");
		hit._id = team.recordElementId(hit.recid[0]);
		hit._onclick = "mkws.showDetails('" + team.name() + "', '" + hit.recid[0] + "');return false;"
		return template(hit);
	    }
	});
    }


    function promoteNavi() {
	team.queue("navi").subscribe(function() {
	    var filters = team.filters();
	    var text = "";

	    for (var i in filters) {
		if (text) {
		    text += " | ";
		}
		var filter = filters[i];
		if (filter.id) {
		    text += M('source') + ': <a class="crossout" href="#" onclick="mkws.delimitTarget(\'' + team.name() +
			"', '" + filter.id + "'" + ');return false;">' + filter.name + '</a>';
		} else {
		    text += M(filter.field) + ': <a class="crossout" href="#" onclick="mkws.delimitQuery(\'' + team.name() +
			"', '" + filter.field + "', '" + filter.value + "'" +
			');return false;">' + filter.value + '</a>';
		}
	    }

	    $(node).html(text);
	});
    }


    function promoteSort() {
	// It seems this and the Perpage widget doen't need to
	// subscribe to anything, since they produce events rather
	// than consuming them.
	$(node).change(function () {
	    team.set_sortOrder($(node).val());
	    if (team.submitted()) {
		team.resetPage();
		team.reShow();
	    }
	    return false;
	});
    }


    function promotePerpage() {
	$(node).change(function() {
	    team.set_perpage($(node).val());
	    if (team.submitted()) {
		team.resetPage();
		team.reShow();
	    }
	    return false;
	});
    }
}


// Factory function for team objects. As much as possible, this uses
// only member variables (prefixed "m_") and inner functions with
// private scope. Some functions are visibl as member-functions to be
// called from outside code -- specifically, from generated
// HTML. These functions are that.switchView(), showDetails(),
// limitTarget(), limitQuery(), delimitTarget(), delimitQuery(),
// pagerPrev(), pagerNext(), showPage().
//
function team($, teamName) {
    var that = {};
    var m_teamName = teamName;
    var m_submitted = false;
    var m_query; // initially undefined
    var m_sortOrder; // will be set below
    var m_perpage; // will be set below
    var m_filters = [];
    var m_totalRecordCount = 0;
    var m_currentPage = 1;
    var m_currentRecordId = '';
    var m_currentRecordData = null;
    var m_logTime = {
	// Timestamps for logging
	"start": $.now(),
	"last": $.now()
    };
    var m_paz; // will be initialised below
    var m_template = {};

    that.name = function() { return m_teamName; }
    that.submitted = function() { return m_submitted; }
    that.perpage = function() { return m_perpage; }
    that.totalRecordCount = function() { return m_totalRecordCount; }
    that.currentPage = function() { return m_currentPage; }
    that.currentRecordId = function() { return m_currentRecordId; }
    that.currentRecordData = function() { return m_currentRecordData; }
    that.filters = function() { return m_filters; }

    that.set_sortOrder = function(val) { m_sortOrder = val };
    that.set_perpage = function(val) { m_perpage = val };


    var log = function (s) {
	var now = $.now();
	var timestamp = ((now - m_logTime.start)/1000).toFixed(3) + " (+" + ((now - m_logTime.last)/1000).toFixed(3) + ") "
	m_logTime.last = now;

	mkws.log(m_teamName + ": " + timestamp + s);
    }
    that.log = log;

    log("start running MKWS");

    m_sortOrder = mkws_config.sort_default;
    m_perpage = mkws_config.perpage_default;

    log("Create main pz2 object");
    // create a parameters array and pass it to the pz2's constructor
    // then register the form submit event with the pz2.search function
    // autoInit is set to true on default
    m_paz = new pz2({ "windowid": teamName,
		      "pazpar2path": mkws_config.pazpar2_url,
		      "usesessions" : mkws_config.use_service_proxy ? false : true,
		      "oninit": onInit,
		      "onbytarget": onBytarget,
		      "onstat": onStat,
		      "onterm": (mkws_config.facets.length ? onTerm : undefined),
		      "onshow": onShow,
		      "onrecord": onRecord,
		      "showtime": 500,            //each timer (show, stat, term, bytarget) can be specified this way
		      "termlist": mkws_config.facets.join(',')
		    });


    //
    // pz2.js event handlers:
    //
    function onInit() {
	log("init");
	m_paz.stat();
	m_paz.bytarget();
    }


    function onBytarget(data) {
	log("target");
	queue("targets").publish(data);
    }


    function onStat(data) {
	log("stat");
	queue("stat").publish(data);
    }


    function onTerm(data) {
	log("term");
	queue("termlists").publish(data);
    }


    function onShow(data, teamName) {
	log("show");
	m_totalRecordCount = data.merged;
	queue("pager").publish(data);
	queue("records").publish(data);
    }


    function onRecord(data, args, teamName) {
	log("record");
	// FIXME: record is async!!
	clearTimeout(m_paz.recordTimer);
	// ##### restrict to current team
	var detRecordDiv = document.getElementById(recordDetailsId(data.recid[0]));
	if (detRecordDiv) {
	    // in case on_show was faster to redraw element
	    return;
	}
	m_currentRecordData = data;
	var recordDiv = findnode('.' + recordElementId(m_currentRecordData.recid[0]));
	var html = renderDetails(m_currentRecordData);
	$(recordDiv).append(html);
    }


    // Used by promoteRecords() and onRecord()
    function recordElementId(s) {
	return 'mkwsRec_' + s.replace(/[^a-z0-9]/ig, '_');
    }
    that.recordElementId = recordElementId;

    // Used by onRecord(), showDetails() and renderDetails()
    function recordDetailsId(s) {
	return 'mkwsDet_' + s.replace(/[^a-z0-9]/ig, '_');
    }
    that.recordElementId = recordElementId;


    that.targetFiltered = function(id) {
	for (var i = 0; i < m_filters.length; i++) {
	    if (m_filters[i].id === id ||
		m_filters[i].id === 'pz:id=' + id) {
		return true;
	    }
	}
	return false;
    }


    ////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////


    // when search button pressed
    function onFormSubmitEventHandler()
    {
	var val = findnode('.mkwsQuery').val();
	newSearch(val);
	return false;
    }


    function newSearch(query, sortOrder, targets)
    {
	log("newSearch: " + query);

	if (mkws_config.use_service_proxy && !mkws.authenticated) {
	    alert("searching before authentication");
	    return;
	}

	m_filters = []
	triggerSearch(query, sortOrder, targets);
	switchView('records'); // In case it's configured to start off as hidden
	m_submitted = true;
    }


    // limit by target functions
    that.limitTarget  = function (id, name)
    {
	log("limitTarget(id=" + id + ", name=" + name + ")");
	m_filters.push({ id: id, name: name });
	triggerSearch();
	return false;
    }


    // limit the query after clicking the facet
    that.limitQuery = function (field, value)
    {
	log("limitQuery(field=" + field + ", value=" + value + ")");
	m_filters.push({ field: field, value: value });
	triggerSearch();
	return false;
    }


    that.delimitTarget = function (id)
    {
	log("delimitTarget(id=" + id + ")");
	var newFilters = [];
	for (var i in m_filters) {
	    var filter = m_filters[i];
	    if (filter.id) {
		log("delimitTarget() removing filter " + $.toJSON(filter));
	    } else {
		log("delimitTarget() keeping filter " + $.toJSON(filter));
		newFilters.push(filter);
	    }
	}
	m_filters = newFilters;

	triggerSearch();
	return false;
    }


    that.delimitQuery = function (field, value)
    {
	log("delimitQuery(field=" + field + ", value=" + value + ")");
	var newFilters = [];
	for (var i in m_filters) {
	    var filter = m_filters[i];
	    if (filter.field &&
		field == filter.field &&
		value == filter.value) {
		log("delimitQuery() removing filter " + $.toJSON(filter));
	    } else {
		log("delimitQuery() keeping filter " + $.toJSON(filter));
		newFilters.push(filter);
	    }
	}
	m_filters = newFilters;

	triggerSearch();
	return false;
    }


    function resetPage()
    {
	m_currentPage = 1;
	m_totalRecordCount = 0;
    }
    that.resetPage = resetPage;


    function triggerSearch (query, sortOrder, targets)
    {
	resetPage();
	queue("navi").publish();

	var pp2filter = "";
	var pp2limit = "";

	// Continue to use previous query/sort-order unless new ones are specified
	if (query) {
	    m_query = query;
	}
	if (sortOrder) {
	    m_sortOrder = sortOrder;
	}
	if (targets) {
	    m_filters.push({ id: targets, name: targets });
	}

	for (var i in m_filters) {
	    var filter = m_filters[i];
	    if (filter.id) {
		if (pp2filter)
		    pp2filter += ",";
		if (filter.id.match(/^[a-z:]+[=~]/)) {
		    log("filter '" + filter.id + "' already begins with SETTING OP");
		} else {
		    filter.id = 'pz:id=' + filter.id;
		}
		pp2filter += filter.id;
	    } else {
		if (pp2limit)
		    pp2limit += ",";
		pp2limit += filter.field + "=" + filter.value.replace(/[\\|,]/g, '\\$&');
	    }
	}

	var params = {};
	if (pp2limit) {
	    params.limit = pp2limit;
	}

	log("triggerSearch(" + m_query + "): filters = " + $.toJSON(m_filters) + ", pp2filter = " + pp2filter + ", params = " + $.toJSON(params));

	// We can use: params.torusquery = "udb=NAME"
	// Note: that won't work when running against raw pazpar2
	m_paz.search(m_query, m_perpage, m_sortOrder, pp2filter, undefined, params);
    }


    that.reShow = function() {
	m_paz.show(0, m_perpage, m_sortOrder);
    }



    that.showPage = function (pageNum)
    {
	m_currentPage = pageNum;
	m_paz.showPage(m_currentPage - 1);
    }


    // simple paging functions
    that.pagerNext = function () {
	if (m_totalRecordCount - m_perpage*m_currentPage > 0) {
            m_paz.showNext();
            m_currentPage++;
	}
    }


    that.pagerPrev = function () {
	if (m_paz.showPrev() != false)
            m_currentPage--;
    }


    // switching view between targets and records
    function switchView(view) {
	var targets = findnode('.mkwsTargets');
	var results = findnode('.mkwsResults,.mkwsRecords');
	var blanket = findnode('.mkwsBlanket');
	var motd    = findnode('.mkwsMOTD');

	switch(view) {
        case 'targets':
            if (targets) targets.css('display', 'block');
            if (results) results.css('display', 'none');
            if (blanket) blanket.css('display', 'none');
            if (motd) motd.css('display', 'none');
            break;
        case 'records':
            if (targets) targets.css('display', 'none');
            if (results) results.css('display', 'block');
            if (blanket) blanket.css('display', 'block');
            if (motd) motd.css('display', 'none');
            break;
	case 'none':
	    alert("mkws.switchView(" + m_teamName + ", 'none') shouldn't happen");
            if (targets) targets.css('display', 'none');
            if (results) results.css('display', 'none');
            if (blanket) blanket.css('display', 'none');
            if (motd) motd.css('display', 'none');
            break;
        default:
            alert("Unknown view '" + view + "'");
	}
    }
    that.switchView = switchView;


    // detailed record drawing
    that.showDetails = function (recId) {
	var oldRecordId = m_currentRecordId;
	m_currentRecordId = recId;

	// remove current detailed view if any
	// ##### restrict to current team
	var detRecordDiv = document.getElementById(recordDetailsId(oldRecordId));
	// lovin DOM!
	if (detRecordDiv)
	    detRecordDiv.parentNode.removeChild(detRecordDiv);

	// if the same clicked, just hide
	if (recId == oldRecordId) {
            m_currentRecordId = '';
            m_currentRecordData = null;
            return;
	}
	// request the record
	log("showDetails() requesting record '" + recId + "'");
	m_paz.record(recId);
    }


    /*
     * All the HTML stuff to render the search forms and
     * result pages.
     */
    function mkwsHtmlAll() {
	mkwsSetLang();
	if (mkws_config.show_lang)
	    mkwsHtmlLang();

	log("HTML search form");
	mkws.handleNodeWithTeam(findnode('.mkwsSearch'), function(tname) {
	    this.html('\
<form name="mkwsSearchForm" class="mkwsSearchForm mkwsTeam_' + tname + '" action="" >\
  <input class="mkwsQuery mkwsTeam_' + tname + '" type="text" size="' + mkws_config.query_width + '" />\
  <input class="mkwsButton mkwsTeam_' + tname + '" type="submit" value="' + M('Search') + '" />\
</form>');
	});

	log("HTML records");
	// If the team has a .mkwsResults, populate it in the usual
	// way. If not, assume that it's a smarter application that
	// defines its own subcomponents, some or all of the
	// following:
	//	.mkwsTermlists
	//	.mkwsRanking
	//	.mkwsPager
	//	.mkwsNavi
	//	.mkwsRecords
	findnode(".mkwsResults").html('\
<table width="100%" border="0" cellpadding="6" cellspacing="0">\
  <tr>\
    <td class="mkwsTermlistContainer1 mkwsTeam_' + m_teamName + '" width="250" valign="top">\
      <div class="mkwsTermlists mkwsTeam_' + m_teamName + '"></div>\
    </td>\
    <td class="mkwsMOTDContainer mkwsTeam_' + m_teamName + '" valign="top">\
      <div class="mkwsRanking mkwsTeam_' + m_teamName + '"></div>\
      <div class="mkwsPager mkwsTeam_' + m_teamName + '"></div>\
      <div class="mkwsNavi mkwsTeam_' + m_teamName + '"></div>\
      <div class="mkwsRecords mkwsTeam_' + m_teamName + '"></div>\
    </td>\
  </tr>\
  <tr>\
    <td colspan="2">\
      <div class="mkwsTermlistContainer2 mkwsTeam_' + m_teamName + '"></div>\
    </td>\
  </tr>\
</table>');

	var ranking_data = '<form name="mkwsSelect" class="mkwsSelect mkwsTeam_' + m_teamName + '" action="" >';
	if (mkws_config.show_sort) {
	    ranking_data +=  M('Sort by') + ' ' + mkwsHtmlSort() + ' ';
	}
	if (mkws_config.show_perpage) {
	    ranking_data += M('and show') + ' ' + mkwsHtmlPerpage() + ' ' + M('per page') + '.';
	}
        ranking_data += '</form>';
	findnode(".mkwsRanking").html(ranking_data);

	mkwsHtmlSwitch();

	findnode('.mkwsSearchForm').submit(onFormSubmitEventHandler);

	// on first page, hide the termlist
	$(document).ready(function() { findnode(".mkwsTermlists").hide(); });
        var container = findnode(".mkwsMOTDContainer");
	if (container.length) {
	    // Move the MOTD from the provided element down into the container
	    findnode(".mkwsMOTD").appendTo(container);
	}
    }


    function mkwsSetLang()  {
	var lang = mkws.getParameterByName("lang") || mkws_config.lang;
	if (!lang || !mkws.locale_lang[lang]) {
	    mkws_config.lang = ""
	} else {
	    mkws_config.lang = lang;
	}

	log("Locale language: " + (mkws_config.lang ? mkws_config.lang : "none"));
	return mkws_config.lang;
    }


    /* create locale language menu */
    function mkwsHtmlLang() {
	var lang_default = "en";
	var lang = mkws_config.lang || lang_default;
	var list = [];

	/* display a list of configured languages, or all */
	var lang_options = mkws_config.lang_options || [];
	var toBeIncluded = {};
	for (var i = 0; i < lang_options.length; i++) {
	    toBeIncluded[lang_options[i]] = true;
	}

	for (var k in mkws.locale_lang) {
	    if (toBeIncluded[k] || lang_options.length == 0)
		list.push(k);
	}

	// add english link
	if (lang_options.length == 0 || toBeIncluded[lang_default])
            list.push(lang_default);

	log("Language menu for: " + list.join(", "));

	/* the HTML part */
	var data = "";
	for(var i = 0; i < list.length; i++) {
	    var l = list[i];

	    if (data)
		data += ' | ';

	    if (lang == l) {
		data += ' <span>' + l + '</span> ';
	    } else {
		data += ' <a href="?lang=' + l + '">' + l + '</a> '
	    }
	}

	findnode(".mkwsLang").html(data);
    }


    function mkwsHtmlSort() {
	log("HTML sort, m_sortOrder = '" + m_sortOrder + "'");
	var sort_html = '<select class="mkwsSort mkwsTeam_' + m_teamName + '">';

	for(var i = 0; i < mkws_config.sort_options.length; i++) {
	    var opt = mkws_config.sort_options[i];
	    var key = opt[0];
	    var val = opt.length == 1 ? opt[0] : opt[1];

	    sort_html += '<option value="' + key + '"';
	    if (m_sortOrder == key || m_sortOrder == val) {
		sort_html += ' selected="selected"';
	    }
	    sort_html += '>' + M(val) + '</option>';
	}
	sort_html += '</select>';

	return sort_html;
    }


    function mkwsHtmlPerpage() {
	log("HTML perpage, m_perpage = " + m_perpage);
	var perpage_html = '<select class="mkwsPerpage mkwsTeam_' + m_teamName + '">';

	for(var i = 0; i < mkws_config.perpage_options.length; i++) {
	    var key = mkws_config.perpage_options[i];

	    perpage_html += '<option value="' + key + '"';
	    if (key == m_perpage) {
		perpage_html += ' selected="selected"';
	    }
	    perpage_html += '>' + key + '</option>';
	}
	perpage_html += '</select>';

	return perpage_html;
    }


    function mkwsHtmlSwitch() {
	log("HTML switch for team " + m_teamName);

	var node = findnode(".mkwsSwitch");
	node.append($('<a href="#" onclick="mkws.switchView(\'' + m_teamName + '\', \'records\')">' + M('Records') + '</a>'));
	node.append($("<span/>", { text: " | " }));
	node.append($('<a href="#" onclick="mkws.switchView(\'' + m_teamName + '\', \'targets\')">' + M('Targets') + '</a>'));

	log("HTML targets");
	var node = findnode(".mkwsTargets");
	node.html('\
<div class="mkwsBytarget mkwsTeam_' + m_teamName + '">\
  No information available yet.\
</div>');
	node.css("display", "none");
    }


    that.runAutoSearch = function() {
	var node = findnode('.mkwsRecords,.mkwsTermlists');
	var query = node.attr('autosearch');
	if (!query)
	    return;

	if (query.match(/^!param!/)) {
	    var param = query.replace(/^!param!/, '');
	    query = mkws.getParameterByName(param);
	    log("obtained query '" + query + "' from param '" + param + "'");
	    if (!query) {
		alert("This page has a MasterKey widget that needs a query specified by the '" + param + "' parameter");
	    }
	} else if (query.match(/^!path!/)) {
	    var index = query.replace(/^!path!/, '');
	    var path = window.location.pathname.split('/');
	    query = path[path.length - index];
	    log("obtained query '" + query + "' from path-component '" + index + "'");
	    if (!query) {
		alert("This page has a MasterKey widget that needs a query specified by the path-component " + index);
	    }
	}

	log("node=" + node + ", class='" + node.className + "', query=" + query);

	var sortOrder = node.attr('sort');
	var targets = node.attr('targets');
	var s = "running auto search: '" + query + "'";
	if (sortOrder) s += " sorted by '" + sortOrder + "'";
	if (targets) s += " in targets '" + targets + "'";
	log(s);

	newSearch(query, sortOrder, targets);
    }


    // Translation function. At present, this is properly a
    // global-level function (hence the assignment to mkws.M) but we
    // want to make it per-team so different teams can operate in
    // different languages.
    //
    function M(word) {
	var lang = mkws_config.lang;

	if (!lang || !mkws.locale_lang[lang])
	    return word;

	return mkws.locale_lang[lang][word] || word;
    }
    mkws.M = M; // so the Handlebars helper can use it


    // Finds the node of the specified class within the current team
    // Multiple OR-clauses separated by commas are handled
    // More complex cases may not work
    //
    function findnode(selector, teamName) {
	teamName = teamName || m_teamName;

	selector = $.map(selector.split(','), function(s, i) {
	    return s + '.mkwsTeam_' + teamName;
	}).join(',');

	return $(selector);
    }


    function renderDetails(data, marker)
    {
	var template = loadTemplate("Record");
	var details = template(data);
	return '<div class="details mkwsTeam_' + m_teamName + '" id="' + recordDetailsId(data.recid[0]) + '">' + details + '</div>';
    }
    that.renderDetails = renderDetails;


    function loadTemplate(name)
    {
	var template = m_template[name];

	if (template === undefined) {
	    // Fall back to generic template if there is no team-specific one
	    var node = findnode(".mkwsTemplate_" + name);
	    if (!node.length) {
		node = findnode(".mkwsTemplate_" + name, "ALL");
	    }

	    var source = node.html();
	    if (!source) {
		source = mkws.defaultTemplate(name);
	    }

	    template = Handlebars.compile(source);
	    log("compiled template '" + name + "'");
	    m_template[name] = template;
	}

	return template;
    }
    that.loadTemplate = loadTemplate;


    // The following PubSub code is modified from the jQuery manual:
    // https://api.jquery.com/jQuery.Callbacks/
    //
    // Use as:
    //	team.queue("eventName").subscribe(function(param1, param2 ...) { ... });
    //	team.queue("eventName").publish(arg1, arg2, ...);

    var queues = {};
    var queue = function(id) {
	if (!queues[id]) {
	    var callbacks = $.Callbacks();
	    queues[id] = {
		publish: callbacks.fire,
		subscribe: callbacks.add,
		unsubscribe: callbacks.remove
	    };
	}
	return queues[id];
    }
    that.queue = queue;


    // main
    (function() {
	try {
	    mkwsHtmlAll()
	}

	catch (e) {
	    mkws_config.error = e.message;
	    // alert(e.message);
	}
    })();

    // Bizarrely, 'that' is just an empty hash. All its state is in
    // the closure variables defined earlier in this function.
    return that;
};


// wrapper to call team() after page load
(function (j) {
    mkws.log = function (string) {
	if (!mkws.log_level)
	    return;

	if (typeof console === "undefined" || typeof console.log === "undefined") { /* ARGH!!! old IE */
	    return;
	}

	// you need to disable use strict at the top of the file!!!
	if (mkws.log_level >= 3) {
	    console.log(arguments.callee.caller);
	} else if (mkws.log_level >= 2) {
	    console.log(">>> called from function " + arguments.callee.caller.name + ' <<<');
	}
	console.log(string);
    }
    var log = mkws.log;


    mkws.handleNodeWithTeam = function(node, callback) {
	// First branch for DOM objects; second branch for jQuery objects
	var classes = node.className || node.attr('class');
	if (!classes) {
	    // For some reason, if we try to proceed when classes is
	    // undefined, we don't get an error message, but this
	    // function and its callers, up several stack level,
	    // silently return. What a crock.
	    mkws.log("handleNodeWithTeam() called on node with no classes");
	    return;
	}
 	var list = classes.split(/\s+/)
	var teamName, type;

	for (var i = 0; i < list.length; i++) {
	    var cname = list[i];
	    if (cname.match(/^mkwsTeam_/)) {
		teamName = cname.replace(/^mkwsTeam_/, '');
	    } else if (cname.match(/^mkws/)) {
		type = cname.replace(/^mkws/, '');
	    }
	}
	callback.call(node, teamName, type);
    }


    mkws.resizePage = function () {
	var list = ["mkwsSwitch", "mkwsLang"];

	var width = mkws_config.responsive_design_width;
	var parent = $(".mkwsTermlists").parent();

	if ($(window).width() <= width &&
	    parent.hasClass("mkwsTermlistContainer1")) {
	    log("changing from wide to narrow: " + $(window).width());
	    $(".mkwsTermlistContainer1").hide();
	    $(".mkwsTermlistContainer2").show();
	    for (var tname in mkws.teams) {
		$(".mkwsTermlists.mkwsTeam_" + tname).appendTo($(".mkwsTermlistContainer2.mkwsTeam_" + tname));
		for(var i = 0; i < list.length; i++) {
		    $("." + list[i] + ".mkwsTeam_" + tname).hide();
		}
	    }
	} else if ($(window).width() > width &&
		   parent.hasClass("mkwsTermlistContainer2")) {
	    log("changing from narrow to wide: " + $(window).width());
	    $(".mkwsTermlistContainer1").show();
	    $(".mkwsTermlistContainer2").hide();
	    for (var tname in mkws.teams) {
		$(".mkwsTermlists.mkwsTeam_" + tname).appendTo($(".mkwsTermlistContainer1.mkwsTeam_" + tname));
		for(var i = 0; i < list.length; i++) {
		    $("." + list[i] + ".mkwsTeam_" + tname).show();
		}
	    }
	}
    };


    mkws.switchView = function(tname, view) {
	mkws.teams[tname].switchView(view);
    }

    mkws.showDetails = function (tname, prefixRecId) {
	mkws.teams[tname].showDetails(prefixRecId);
    }

    mkws.limitTarget  = function (tname, id, name) {
	mkws.teams[tname].limitTarget(id, name);
    }

    mkws.limitQuery  = function (tname, field, value) {
	mkws.teams[tname].limitQuery(field, value);
    }

    mkws.delimitTarget = function (tname, id) {
	mkws.teams[tname].delimitTarget(id);
    }

    mkws.delimitQuery = function (tname, field, value) {
	mkws.teams[tname].delimitQuery(field, value);
    }

    mkws.showPage = function (tname, pageNum) {
	mkws.teams[tname].showPage(pageNum);
    }

    mkws.pagerPrev = function (tname) {
	mkws.teams[tname].pagerPrev();
    }

    mkws.pagerNext = function (tname) {
	mkws.teams[tname].pagerNext();
    }


    // This function is taken from a StackOverflow answer
    // http://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript/901144#901144
    mkws.getParameterByName = function(name) {
	name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
	var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
	    results = regex.exec(location.search);
	return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }


    mkws.defaultTemplate = function(name)
    {
	if (name === 'Record') {
	    return '\
<table>\
  <tr>\
    <th>{{translate "Title"}}</th>\
    <td>\
      {{md-title}}\
      {{#if md-title-remainder}}\
	({{md-title-remainder}})\
      {{/if}}\
      {{#if md-title-responsibility}}\
	<i>{{md-title-responsibility}}</i>\
      {{/if}}\
    </td>\
  </tr>\
  {{#if md-date}}\
  <tr>\
    <th>{{translate "Date"}}</th>\
    <td>{{md-date}}</td>\
  </tr>\
  {{/if}}\
  {{#if md-author}}\
  <tr>\
    <th>{{translate "Author"}}</th>\
    <td>{{md-author}}</td>\
  </tr>\
  {{/if}}\
  {{#if md-electronic-url}}\
  <tr>\
    <th>{{translate "Links"}}</th>\
    <td>\
      {{#each md-electronic-url}}\
	<a href="{{this}}">Link{{index1}}</a>\
      {{/each}}\
    </td>\
  </tr>\
  {{/if}}\
  {{#if-any location having="md-subject"}}\
  <tr>\
    <th>{{translate "Subject"}}</th>\
    <td>\
      {{#first location having="md-subject"}}\
	{{#if md-subject}}\
	  {{#commaList md-subject}}\
	    {{this}}{{/commaList}}\
	{{/if}}\
      {{/first}}\
    </td>\
  </tr>\
  {{/if-any}}\
  <tr>\
    <th>{{translate "Locations"}}</th>\
    <td>\
      {{#commaList location}}\
	{{attr "@name"}}{{/commaList}}\
    </td>\
  </tr>\
</table>\
';
	} else if (name === "Summary") {
	    return '\
<a href="#" id="{{_id}}" onclick="{{_onclick}}">\
  <b>{{md-title}}</b>\
</a>\
{{#if md-title-remainder}}\
  <span>{{md-title-remainder}}</span>\
{{/if}}\
{{#if md-title-responsibility}}\
  <span><i>{{md-title-responsibility}}</i></span>\
{{/if}}\
';
	}

	var s = "There is no default '" + name +"' template!";
	alert(s);
	return s;
    }


    function defaultMkwsConfig() {
	/* default mkws config */
	var config_default = {
	    use_service_proxy: true,
	    pazpar2_url: "//mkws.indexdata.com/service-proxy/",
	    service_proxy_auth: "//mkws.indexdata.com/service-proxy-auth",
	    lang: "",
	    sort_options: [["relevance"], ["title:1", "title"], ["date:0", "newest"], ["date:1", "oldest"]],
	    perpage_options: [10, 20, 30, 50],
	    sort_default: "relevance",
	    perpage_default: 20,
	    query_width: 50,
	    show_lang: true, 	/* show/hide language menu */
	    show_sort: true, 	/* show/hide sort menu */
	    show_perpage: true, 	/* show/hide perpage menu */
	    lang_options: [], 	/* display languages links for given languages, [] for all */
	    facets: ["xtargets", "subject", "author"], /* display facets, in this order, [] for none */
	    responsive_design_width: undefined, /* a page with less pixel width considered as narrow */
	    log_level: 1,     /* log level for development: 0..2 */

	    dummy: "dummy"
	};

	// Set global log_level flag early so that log() works
	// Fall back to old "debug_level" setting for backwards compatibility
	var tmp = mkws_config.log_level;
	if (typeof(tmp) === 'undefined') tmp = mkws_config.debug_level;

	if (typeof(tmp) !== 'undefined') {
	    mkws.log_level = tmp;
	} else if (typeof(config_default.log_level) !== 'undefined') {
	    mkws.log_level = config_default.log_level;
	}

	// make sure the mkws_config is a valid hash
	if (!$.isPlainObject(mkws_config)) {
	    log("ERROR: mkws_config is not an JS object, ignore it....");
	    mkws_config = {};
	}

	/* override standard config values by function parameters */
	for (var k in config_default) {
	    if (typeof mkws_config[k] === 'undefined')
		mkws_config[k] = config_default[k];
	    //log("Set config: " + k + ' => ' + mkws_config[k]);
	}
    }


    /*
     * Run service-proxy authentication in background (after page load).
     * The username/password is configured in the apache config file
     * for the site.
     */
    function authenticateSession(auth_url, auth_domain, pp2_url) {
	log("Run service proxy auth URL: " + auth_url);

	if (!auth_domain) {
	    auth_domain = pp2_url.replace(/^(https?:)?\/\/(.*?)\/.*/, '$2');
	    log("guessed auth_domain '" + auth_domain + "' from pp2_url '" + pp2_url + "'");
	}

	var request = new pzHttpRequest(auth_url, function(err) {
	    alert("HTTP call for authentication failed: " + err)
	    return;
	}, auth_domain);

	request.get(null, function(data) {
	    if (!$.isXMLDoc(data)) {
		alert("service proxy auth response document is not valid XML document, give up!");
		return;
	    }
	    var status = $(data).find("status");
	    if (status.text() != "OK") {
		alert("service proxy auth repsonse status: " + status.text() + ", give up!");
		return;
	    }

	    log("Service proxy auth successfully done");
	    mkws.authenticated = true;
	    runAutoSearches();
	});
    }


    function runAutoSearches() {
	log("running auto searches");

	for (var teamName in mkws.teams) {
	    mkws.teams[teamName].runAutoSearch();
	}
    }


    $(document).ready(function() {
	log("on load ready");
	defaultMkwsConfig();

	if (mkws_config.query_width < 5 || mkws_config.query_width > 150) {
	    log("Reset query width: " + mkws_config.query_width);
	    mkws_config.query_width = 50;
	}

	for (var key in mkws_config) {
	    if (mkws_config.hasOwnProperty(key)) {
		if (key.match(/^language_/)) {
		    var lang = key.replace(/^language_/, "");
		    // Copy custom languages into list
		    mkws.locale_lang[lang] = mkws_config[key];
		    log("Added locally configured language '" + lang + "'");
		}
	    }
	}

	if (mkws_config.responsive_design_width) {
	    // Responsive web design - change layout on the fly based on
	    // current screen width. Required for mobile devices.
	    $(window).resize(function(e) { mkws.resizePage() });
	    // initial check after page load
	    $(document).ready(function() { mkws.resizePage() });
	}

	// protocol independent link for pazpar2: "//mkws/sp" -> "https://mkws/sp"
	if (mkws_config.pazpar2_url.match(/^\/\//)) {
	    mkws_config.pazpar2_url = document.location.protocol + mkws_config.pazpar2_url;
	    log("adjust protocol independent links: " + mkws_config.pazpar2_url);
	}

	// Backwards compatibility: set new magic class names on any
	// elements that have the old magic IDs.
	var ids = [ "Switch", "Lang", "Search", "Pager", "Navi",
		    "Results", "Records", "Targets", "Ranking",
		    "Termlists", "Stat", "MOTD" ];
	for (var i = 0; i < ids.length; i++) {
	    var id = 'mkws' + ids[i];
	    var node = $('#' + id);
	    if (node.attr('id')) {
		node.addClass(id);
		log("added magic class to '" + node.attr('id') + "'");
	    }
	}

	// For all MKWS-classed nodes that don't have a team
	// specified, set the team to AUTO.
	$('[class^="mkws"],[class*=" mkws"]').each(function () {
	    if (!this.className.match(/mkwsTeam_/)) {
		log("adding AUTO team to node with class '" + this.className + "'");
		$(this).addClass('mkwsTeam_AUTO');
	    }
	});

	// Find all nodes with an MKWS class, and determine their team from
	// the mkwsTeam_* class. Make all team objects.
	var then = $.now();
	$('[class^="mkws"],[class*=" mkws"]').each(function () {
	    mkws.handleNodeWithTeam(this, function(tname, type) {
		if (!mkws.teams[tname]) {
		    mkws.teams[tname] = team(j, tname);
		    log("Made MKWS team '" + tname + "'");
		}
	    });
	});
	// Second pass: make the individual widget objects. This has
	// to be done separately, and after the team-creation, since
	// that sometimes makes new widget nodes (e.g. creating
	// mkwsTermlists inside mkwsResults.
	$('[class^="mkws"],[class*=" mkws"]').each(function () {
	    mkws.handleNodeWithTeam(this, function(tname, type) {
		var myTeam = mkws.teams[tname];
		var myWidget = widget(j, myTeam, type, this);
	    });
	});
	var now = $.now();
	log("Walking MKWS nodes took " + (now-then) + " ms");

	if (mkws_config.use_service_proxy) {
	    authenticateSession(mkws_config.service_proxy_auth,
				mkws_config.service_proxy_auth_domain,
				mkws_config.pazpar2_url);
	} else {
	    // raw pp2
	    runAutoSearches();
	}
    });
})(jQuery);