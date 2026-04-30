// Configuration
const mapImage = "reserve-map.jpg";
const csvFile = "Lekagul Sensor Data.csv";
const mapWidth = 600;
const mapHeight = 600;
const scale = 600 / 982;

// Location coordinates
const coords = {
    "entrance0": { x: 308 * scale, y: 69 * scale },
    "entrance1": { x: 89 * scale, y: 333 * scale },
    "entrance2": { x: 897 * scale, y: 429 * scale },
    "entrance3": { x: 566 * scale, y: 817 * scale },
    "entrance4": { x: 688 * scale, y: 902 * scale },
    "general-gate0": { x: 541 * scale, y: 49 * scale },
    "general-gate1": { x: 318 * scale, y: 127 * scale },
    "general-gate2": { x: 512 * scale, y: 161 * scale },
    "general-gate3": { x: 912 * scale, y: 273 * scale },
    "general-gate4": { x: 340 * scale, y: 482 * scale },
    "general-gate5": { x: 609 * scale, y: 546 * scale },
    "general-gate6": { x: 667 * scale, y: 673 * scale },
    "general-gate7": { x: 322 * scale, y: 707 * scale },
    "ranger-stop0": { x: 439 * scale, y: 84 * scale },
    "ranger-stop1": { x: 98 * scale, y: 120 * scale },
    "ranger-stop2": { x: 395 * scale, y: 175 * scale },
    "ranger-stop3": { x: 725 * scale, y: 224 * scale },
    "ranger-stop4": { x: 94 * scale, y: 467 * scale },
    "ranger-stop5": { x: 741 * scale, y: 581 * scale },
    "ranger-stop6": { x: 606 * scale, y: 722 * scale },
    "ranger-stop7": { x: 494 * scale, y: 746 * scale },
    "ranger-base": { x: 629 * scale, y: 858 * scale },
    "camping0": { x: 258 * scale, y: 204 * scale },
    "camping1": { x: 635 * scale, y: 249 * scale },
    "camping2": { x: 221 * scale, y: 317 * scale },
    "camping3": { x: 225 * scale, y: 339 * scale },
    "camping4": { x: 239 * scale, y: 440 * scale },
    "camping5": { x: 102 * scale, y: 594 * scale },
    "camping6": { x: 735 * scale, y: 867 * scale },
    "camping7": { x: 888 * scale, y: 712 * scale },
    "camping8": { x: 897 * scale, y: 238 * scale },
    "gate0": { x: 313 * scale, y: 165 * scale },
    "gate1": { x: 286 * scale, y: 220 * scale },
    "gate2": { x: 122 * scale, y: 270 * scale },
    "gate3": { x: 731 * scale, y: 297 * scale },
    "gate4": { x: 806 * scale, y: 561 * scale },
    "gate5": { x: 644 * scale, y: 716 * scale },
    "gate6": { x: 572 * scale, y: 740 * scale },
    "gate7": { x: 477 * scale, y: 786 * scale },
    "gate8": { x: 677 * scale, y: 887 * scale }
};

const findings = [
    {
        id: "dumping-route",
        category: "Critical",
        tone: "critical",
        title: "Illegal dumping centers on Ranger-Stop 3",
        body: "The second progress deck concludes the evidence supports illegal factory waste dumping near Ranger-Stop 3, with nearby Camping 1 showing suppressed activity consistent with environmental harm.",
        source: "Progress 2, slides 17 and 20",
        locations: ["ranger-stop3", "camping1"]
    },
    {
        id: "night-window",
        category: "Critical",
        tone: "critical",
        title: "Illegal activity clusters on Tuesday and Thursday nights",
        body: "All illegal restricted-access activity occurs on Tuesday and Thursday, with the suspected dumping window concentrated around 2am to 5am rather than normal park traffic hours.",
        source: "Progress 2, slides 12, 18, and 20",
        locations: ["ranger-stop3", "gate3", "gate5", "gate6"]
    },
    {
        id: "restricted-route",
        category: "Critical",
        tone: "critical",
        title: "One suspicious restricted route repeats 23 times",
        body: "Excluding ranger vehicles, only one route repeatedly enters the restricted gate network. That route appears 23 times and includes the unusual pattern of a non-camper entering and exiting through the same entrance gate.",
        source: "Progress 2, slides 13 and 20",
        locations: ["gate3", "gate5", "gate6", "ranger-stop3"]
    },
    {
        id: "truck-rs",
        category: "Critical",
        tone: "critical",
        title: "Heavy trucks at ranger-stops are the strongest suspect set",
        body: "A heavy-truck vehicle ID with repeated multi-day visits to ranger-stop sensors was identified as the most suspicious vehicle pattern, matching the ground-truth dumping narrative.",
        source: "Progress 1, slide 13",
        locations: ["ranger-stop3", "ranger-stop6"]
    },
    {
        id: "gate-breach",
        category: "Warning",
        tone: "warning",
        title: "Restricted gate breaches include 46 type-4 entries",
        body: "Unauthorized type-4 vehicles appear 46 times through gates 3, 5, 6 and at ranger-stops 3 and 6, despite those areas being ranger-restricted.",
        source: "Progress 1, slide 12",
        locations: ["gate3", "gate5", "gate6", "ranger-stop3", "ranger-stop6"]
    },
    {
        id: "sensor-gap",
        category: "Warning",
        tone: "warning",
        title: "Ranger-Stop 1 reveals a likely sensor bypass",
        body: "Car type 1 was detected at Ranger-Stop 1 twelve times in July, even though reaching that stop should require passing Gate 2. No matching Gate 2 records were found.",
        source: "Progress 1, slide 14",
        locations: ["ranger-stop1", "gate2"]
    },
    {
        id: "multi-day-stays",
        category: "Context",
        tone: "context",
        title: "Non-camper multi-day stays look deliberate, not recreational",
        body: "A consistent pattern of 4 to 5 day stays by the same long-lived vehicle IDs appears from Sunday night to Friday morning without camping stops, suggesting work or conservation operations rather than visitors.",
        source: "Progress 1, slides 8 to 10",
        locations: ["entrance0", "entrance1", "entrance2", "entrance3", "entrance4"]
    },
    {
        id: "ranger-baseline",
        category: "Context",
        tone: "context",
        title: "Ranger traffic follows a daytime patrol baseline",
        body: "Park-service vehicles concentrate on ranger-stops and the ranger base during daytime operational hours, with very little late-night activity. That baseline helps isolate the suspicious overnight window.",
        source: "Progress 1, slide 11 and Progress 2, slide 18",
        locations: ["ranger-base", "ranger-stop0", "ranger-stop1", "ranger-stop2", "ranger-stop3", "ranger-stop4", "ranger-stop5", "ranger-stop6", "ranger-stop7"]
    },
    {
        id: "may-ranger-drop",
        category: "Context",
        tone: "context",
        title: "Ranger activity drops sharply in May 2015 and 2016",
        body: "The slides report at least 300 fewer ranger detections during May in both 2015 and 2016, which may reflect staffing, budget, or assignment changes.",
        source: "Progress 2, slide 6",
        locations: ["ranger-base"]
    },
    {
        id: "summer-bus-traffic",
        category: "Context",
        tone: "context",
        title: "Summer traffic peaks in July, especially around July 4",
        body: "Peak preserve traffic occurs in the summer months, with the highest activity in July and a strong spike during the week of July 4. Bus traffic, especially vehicle type 5, rises steadily and can nearly double.",
        source: "Progress 2, slides 7, 9, and 10",
        locations: ["camping0", "camping1", "camping2", "camping3", "camping4", "camping5", "camping6", "camping7", "camping8"]
    }
];

// Global state
let fullData = [];
let parsedData = [];
let filteredData = [];
let currentZoom = d3.zoomIdentity;
let svgSelection = null;
let zoomBehavior = null;
let activeGateName = null;
let sessionSummaries = [];
let activeProgressFilter = "all";
let activeFindingId = null;

const zoomDuration = 750;
const zoomPadding = 32;
const minFocusBoxSize = 120;
const maxZoomScale = 8;
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function toneRank(tone) {
    return { critical: 3, warning: 2, context: 1 }[tone] || 0;
}

function getVisibleFindings() {
    if (activeProgressFilter === "all") {
        return findings;
    }
    return findings.filter(finding => finding.source.includes(activeProgressFilter));
}

function getLocationTone(locationName) {
    return getVisibleFindings().reduce((highestTone, finding) => {
        if (!finding.locations.includes(locationName)) {
            return highestTone;
        }
        return toneRank(finding.tone) > toneRank(highestTone) ? finding.tone : highestTone;
    }, null);
}

function renderOverviewChips() {
    const visibleFindings = getVisibleFindings();
    const uniqueLocations = new Set(visibleFindings.flatMap(finding => finding.locations));
    const criticalLocations = new Set(
        visibleFindings.filter(finding => finding.tone === "critical").flatMap(finding => finding.locations)
    );
    const chips = [
        { value: activeProgressFilter === "all" ? 2 : 1, label: "Source Decks" },
        { value: visibleFindings.length, label: "Key Findings" },
        { value: criticalLocations.size, label: "Critical Locations" },
        { value: uniqueLocations.size, label: "Mapped Evidence Sites" }
    ];

    const chipSelection = d3.select("#overview-chips")
        .selectAll(".overview-chip")
        .data(chips);

    chipSelection.exit().remove();

    const chipEnter = chipSelection.enter()
        .append("div")
        .attr("class", "overview-chip");

    chipEnter.append("strong");
    chipEnter.append("span");

    chipEnter.merge(chipSelection)
        .each(function(d) {
            const chip = d3.select(this);
            chip.select("strong").text(d.value);
            chip.select("span").text(d.label);
        });
}

function getPrimaryFindingForLocation(locationName) {
    return getVisibleFindings()
        .filter(finding => finding.locations.includes(locationName))
        .sort((a, b) => toneRank(b.tone) - toneRank(a.tone))[0] || null;
}

function renderProgressFilters() {
    const options = [
        { id: "all", label: "All Findings" },
        { id: "Progress 1", label: "Progress 1" },
        { id: "Progress 2", label: "Progress 2" }
    ];

    const tabs = d3.select("#progress-filters")
        .selectAll(".progress-pill")
        .data(options, d => d.id);

    tabs.exit().remove();

    const tabsEnter = tabs.enter()
        .append("button")
        .attr("type", "button")
        .attr("class", "progress-pill")
        .on("click", (_, d) => {
            activeProgressFilter = d.id;
            activeFindingId = null;
            renderProgressFilters();
            renderOverviewChips();
            renderFindingBoard();
            updateVisualizations();
        });

    tabsEnter.merge(tabs)
        .attr("class", d => `progress-pill${activeProgressFilter === d.id ? " is-active" : ""}`)
        .text(d => d.label);
}

function renderFindingBoard() {
    const boardFindings = getVisibleFindings();
    const board = d3.select("#finding-board");

    if (boardFindings.length > 0) {
        board.selectAll("p.detail-copy").remove();
    }

    const cards = board.selectAll(".board-card").data(boardFindings, d => d.id);

    cards.exit().remove();

    const cardsEnter = cards.enter()
        .append("article")
        .attr("class", d => `board-card is-${d.tone}`)
        .on("click", (_, d) => {
            activeFindingId = d.id;
            selectLocationByName(d.locations[0], { resetFilters: true, findingId: d.id });
        });

    const meta = cardsEnter.append("div").attr("class", "board-meta");
    meta.append("span").attr("class", "board-source");
    meta.append("span").attr("class", "board-tone");
    cardsEnter.append("h3").attr("class", "board-title");
    cardsEnter.append("p").attr("class", "board-body");
    cardsEnter.append("p").attr("class", "board-locations");

    cardsEnter.merge(cards)
        .attr("class", d => `board-card is-${d.tone}${activeFindingId === d.id ? " is-active" : ""}`)
        .each(function(d) {
            const card = d3.select(this);
            card.select(".board-source").text(d.source.split(",")[0]);
            card.select(".board-tone")
                .attr("class", `board-tone is-${d.tone}`)
                .text(d.category);
            card.select(".board-title").text(d.title);
            card.select(".board-body").text(d.body);
            card.select(".board-locations").html(`<strong>Locations:</strong> ${d.locations.slice(0, 4).join(", ")}${d.locations.length > 4 ? " ..." : ""}`);
        });

    if (!boardFindings.length) {
        board.html("<p class=\"detail-copy\">No findings match the selected progress filter.</p>");
    }
}

function isEntrance(name) {
    return name.startsWith("entrance");
}

function isRangerVehicle(carType) {
    return String(carType).includes("P");
}

function monthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMetricValue(value) {
    if (typeof value === "number") {
        return Number.isInteger(value) ? value.toLocaleString() : value.toFixed(1);
    }
    return value;
}

function formatTime(date) {
    return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

function buildSessionSummaries(records) {
    const grouped = d3.group(records, d => d["car-id"]);
    const sessions = [];

    grouped.forEach((vehicleRecords, carId) => {
        const sorted = vehicleRecords.slice().sort((a, b) => a.parsedTime - b.parsedTime);
        let activeSession = null;

        sorted.forEach(record => {
            const gateName = record["gate-name"];

            if (isEntrance(gateName)) {
                if (!activeSession) {
                    activeSession = {
                        carId,
                        carType: record["car-type"],
                        startGate: gateName,
                        startTime: record.parsedTime,
                        route: [gateName]
                    };
                    return;
                }

                activeSession.route.push(gateName);
                const durationHours = (record.parsedTime - activeSession.startTime) / 36e5;

                if (durationHours >= 0) {
                    sessions.push({
                        carId,
                        carType: activeSession.carType,
                        startGate: activeSession.startGate,
                        endGate: gateName,
                        startTime: activeSession.startTime,
                        endTime: record.parsedTime,
                        durationHours,
                        route: activeSession.route.slice()
                    });
                }

                activeSession = {
                    carId,
                    carType: record["car-type"],
                    startGate: gateName,
                    startTime: record.parsedTime,
                    route: [gateName]
                };
                return;
            }

            if (activeSession) {
                activeSession.route.push(gateName);
            }
        });
    });

    return sessions;
}

function renderEvidence(stats, headers, rows, emptyMessage) {
    const statsContainer = d3.select("#detailStatsContainer").selectAll(".gate-stat").data(stats);
    statsContainer.exit().remove();
    statsContainer.enter()
        .append("div")
        .attr("class", "gate-stat")
        .merge(statsContainer)
        .html(d => `<strong>${formatMetricValue(d.value)}</strong><div class="gate-stat-label">${d.label}</div>`);

    if (!rows.length) {
        d3.select("#detailTableContainer").html(`<p class="detail-copy">${emptyMessage}</p>`);
        return;
    }

    const tableHtml = `
        <table class="data-table">
            <thead>
                <tr>${headers.map(header => `<th>${header}</th>`).join("")}</tr>
            </thead>
            <tbody>
                ${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("")}
            </tbody>
        </table>
    `;

    d3.select("#detailTableContainer").html(tableHtml);
}

function buildRestrictedEvidence(gateName) {
    const records = parsedData.filter(d => d["gate-name"] === gateName);
    const nonRanger = records.filter(d => !isRangerVehicle(d["car-type"]));
    const heavyTruck = nonRanger.filter(d => String(d["car-type"]) === "4");
    const overnight = nonRanger.filter(d => ["Tuesday", "Thursday"].includes(d.dayName) && d.hour >= 2 && d.hour < 5);

    const grouped = d3.rollups(nonRanger, rows => ({
        carType: rows[0]["car-type"],
        visits: rows.length,
        overnightVisits: rows.filter(d => ["Tuesday", "Thursday"].includes(d.dayName) && d.hour >= 2 && d.hour < 5).length,
        firstSeen: d3.min(rows, d => d.parsedTime),
        lastSeen: d3.max(rows, d => d.parsedTime)
    }), d => d["car-id"])
        .sort((a, b) => (b[1].overnightVisits - a[1].overnightVisits) || (b[1].visits - a[1].visits))
        .slice(0, 8);

    return {
        summary: `This location is part of the restricted-access story from your slides, so the panel only shows non-ranger evidence tied to unauthorized entries and the Tuesday/Thursday overnight dumping window.`,
        stats: [
            { label: "Non-Ranger Visits", value: nonRanger.length },
            { label: "Heavy Truck Visits", value: heavyTruck.length },
            { label: "Tue/Thu 2-5am Visits", value: overnight.length },
            { label: "Suspicious Vehicle IDs", value: grouped.length }
        ],
        headers: ["Vehicle ID", "Type", "Visits", "Tue/Thu 2-5am", "First Seen", "Last Seen"],
        rows: grouped.map(([carId, info]) => [
            `<code style="background: rgba(15, 23, 42, 0.88); color: #e2e8f0; padding: 2px 6px; border-radius: 3px;">${carId}</code>`,
            `<strong>Type ${info.carType}</strong>`,
            info.visits.toLocaleString(),
            info.overnightVisits.toLocaleString(),
            formatTime(info.firstSeen),
            formatTime(info.lastSeen)
        ]),
        emptyMessage: "No suspicious non-ranger records were found for this restricted location."
    };
}

function buildSensorGapEvidence() {
    const stopRecords = parsedData.filter(d => d["gate-name"] === "ranger-stop1" && String(d["car-type"]) === "1");
    const gate2Ids = new Set(parsedData
        .filter(d => d["gate-name"] === "gate2" && String(d["car-type"]) === "1")
        .map(d => d["car-id"]));
    const unmatched = stopRecords.filter(d => !gate2Ids.has(d["car-id"]));
    const julyCount = unmatched.filter(d => d.parsedTime.getMonth() === 6).length;

    const grouped = d3.rollups(unmatched, rows => ({
        visits: rows.length,
        julyVisits: rows.filter(d => d.parsedTime.getMonth() === 6).length,
        firstSeen: d3.min(rows, d => d.parsedTime),
        lastSeen: d3.max(rows, d => d.parsedTime)
    }), d => d["car-id"])
        .sort((a, b) => b[1].visits - a[1].visits)
        .slice(0, 8);

    return {
        summary: `The slide finding here is the sensor-gap anomaly: type 1 vehicles appear at Ranger-Stop 1 without matching Gate 2 detections, so the panel only shows those unmatched examples.`,
        stats: [
            { label: "Type 1 at Stop 1", value: stopRecords.length },
            { label: "Unmatched Gate 2 IDs", value: grouped.length },
            { label: "Unmatched July Detections", value: julyCount },
            { label: "Matching Gate 2 IDs", value: gate2Ids.size }
        ],
        headers: ["Vehicle ID", "Visits at Stop 1", "July Visits", "First Seen", "Last Seen"],
        rows: grouped.map(([carId, info]) => [
            `<code style="background: rgba(15, 23, 42, 0.88); color: #e2e8f0; padding: 2px 6px; border-radius: 3px;">${carId}</code>`,
            info.visits.toLocaleString(),
            info.julyVisits.toLocaleString(),
            formatTime(info.firstSeen),
            formatTime(info.lastSeen)
        ]),
        emptyMessage: "No unmatched type 1 records were found for the Ranger-Stop 1 / Gate 2 anomaly."
    };
}

function buildCampingEvidence(gateName) {
    const records = parsedData.filter(d => d["gate-name"] === gateName);
    const monthly = d3.rollups(records, rows => rows.length, d => monthKey(d.parsedTime))
        .sort((a, b) => a[0].localeCompare(b[0]));
    const summerCount = records.filter(d => [5, 6, 7].includes(d.parsedTime.getMonth())).length;
    const julyCount = records.filter(d => d.parsedTime.getMonth() === 6).length;
    const busCount = records.filter(d => String(d["car-type"]) === "5").length;

    const campsiteTotals = d3.rollups(parsedData.filter(d => d["gate-name"].startsWith("camping")), rows => rows.length, d => d["gate-name"])
        .sort((a, b) => a[1] - b[1]);
    const rank = campsiteTotals.findIndex(([name]) => name === gateName) + 1;

    return {
        summary: gateName === "camping1"
            ? `Your slides link Camping 1 to the suspected dump site near Ranger-Stop 3, so this view emphasizes the campsite’s suppressed traffic during the busiest months instead of listing every passing vehicle.`
            : `Your slides emphasize seasonal campground demand and summer spikes, so this view shows month-level traffic and bus-heavy seasonal pressure rather than raw IDs.`,
        stats: [
            { label: "Total Detections", value: records.length },
            { label: "Summer Detections", value: summerCount },
            { label: "July Detections", value: julyCount },
            { label: "Traffic Rank Among Campsites", value: `${rank}/${campsiteTotals.length}` }
        ],
        headers: ["Month", "Detections", "Bus Visits", "Share of Total"],
        rows: monthly.slice(-8).map(([month, count]) => {
            const monthRecords = records.filter(d => monthKey(d.parsedTime) === month);
            const monthBus = monthRecords.filter(d => String(d["car-type"]) === "5").length;
            return [
                month,
                count.toLocaleString(),
                monthBus.toLocaleString(),
                `${((count / records.length) * 100).toFixed(1)}%`
            ];
        }),
        emptyMessage: "No campsite traffic matched this location."
    };
}

function buildEntranceEvidence(gateName) {
    const sessions = sessionSummaries
        .filter(session => session.startGate === gateName || session.endGate === gateName)
        .filter(session => session.durationHours >= 24)
        .sort((a, b) => b.durationHours - a.durationHours);

    const multiDay = sessions.filter(session => session.durationHours >= 72);
    const recurringIds = new Set(multiDay.map(session => session.carId)).size;
    const avgDurationDays = multiDay.length ? d3.mean(multiDay, d => d.durationHours / 24) : 0;

    return {
        summary: `The slide decks call out long non-camper stays that look operational rather than recreational, so this entrance view shows only long-duration sessions instead of every single vehicle crossing.`,
        stats: [
            { label: "24h+ Sessions", value: sessions.length },
            { label: "4-5 Day Sessions", value: multiDay.length },
            { label: "Recurring Vehicle IDs", value: recurringIds },
            { label: "Average Multi-Day Stay", value: `${avgDurationDays.toFixed(1)} days` }
        ],
        headers: ["Vehicle ID", "Type", "Start", "End", "Duration", "Route Snapshot"],
        rows: multiDay.slice(0, 8).map(session => [
            `<code style="background: rgba(15, 23, 42, 0.88); color: #e2e8f0; padding: 2px 6px; border-radius: 3px;">${session.carId}</code>`,
            `<strong>Type ${session.carType}</strong>`,
            formatTime(session.startTime),
            formatTime(session.endTime),
            `${(session.durationHours / 24).toFixed(1)} days`,
            session.route.slice(0, 5).join(" → ")
        ]),
        emptyMessage: "No long-duration sessions were found for this entrance."
    };
}

function buildRangerEvidence(gateName) {
    const records = parsedData.filter(d => d["gate-name"] === gateName && isRangerVehicle(d["car-type"]));
    const overnight = records.filter(d => d.hour < 6 || d.hour >= 20).length;
    const peakHourEntry = d3.greatest(
        d3.rollups(records, rows => rows.length, d => d.hour),
        d => d[1]
    );
    const hourlyRows = d3.rollups(records, rows => rows.length, d => d.hour)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    return {
        summary: `The slides use ranger traffic as a baseline pattern of life, so this panel focuses on ranger-only operating hours and hourly concentration rather than all vehicle IDs at the location.`,
        stats: [
            { label: "Ranger Detections", value: records.length },
            { label: "Nighttime Share", value: records.length ? `${((overnight / records.length) * 100).toFixed(1)}%` : "0%" },
            { label: "Unique Ranger IDs", value: new Set(records.map(d => d["car-id"])).size },
            { label: "Peak Hour", value: peakHourEntry ? `${peakHourEntry[0]}:00` : "N/A" }
        ],
        headers: ["Hour", "Ranger Detections", "Share of Ranger Traffic"],
        rows: hourlyRows.map(([hour, count]) => [
            `${String(hour).padStart(2, "0")}:00`,
            count.toLocaleString(),
            `${((count / records.length) * 100).toFixed(1)}%`
        ]),
        emptyMessage: "No ranger-vehicle detections were found for this location."
    };
}

function buildGenericEvidence(gateName) {
    const records = parsedData.filter(d => d["gate-name"] === gateName);
    const byType = d3.rollups(records, rows => rows.length, d => d["car-type"])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    const byHour = d3.rollups(records, rows => rows.length, d => d.hour)
        .sort((a, b) => b[1] - a[1])[0];

    return {
        summary: `No specific anomaly slide was attached to this location, so the panel shows a compact traffic profile instead of every raw car-id detection.`,
        stats: [
            { label: "Total Detections", value: records.length },
            { label: "Unique Vehicle IDs", value: new Set(records.map(d => d["car-id"])).size },
            { label: "Vehicle Types Present", value: new Set(records.map(d => d["car-type"])).size },
            { label: "Peak Hour", value: byHour ? `${byHour[0]}:00` : "N/A" }
        ],
        headers: ["Vehicle Type", "Detections", "Share of Total"],
        rows: byType.map(([type, count]) => [
            `<strong>Type ${type}</strong>`,
            count.toLocaleString(),
            `${((count / records.length) * 100).toFixed(1)}%`
        ]),
        emptyMessage: "No evidence was available for this location."
    };
}

function getEvidenceForGate(gateName) {
    if (["gate3", "gate5", "gate6", "ranger-stop3", "ranger-stop6"].includes(gateName)) {
        return buildRestrictedEvidence(gateName);
    }
    if (["ranger-stop1", "gate2"].includes(gateName)) {
        return buildSensorGapEvidence();
    }
    if (gateName.startsWith("camping")) {
        return buildCampingEvidence(gateName);
    }
    if (gateName.startsWith("entrance")) {
        return buildEntranceEvidence(gateName);
    }
    if (gateName.startsWith("ranger")) {
        return buildRangerEvidence(gateName);
    }
    return buildGenericEvidence(gateName);
}

function isDefaultZoom(transform) {
    return Math.abs(transform.k - 1) < 0.001 &&
        Math.abs(transform.x) < 0.5 &&
        Math.abs(transform.y) < 0.5;
}

function updateActiveLocationStyles() {
    const hasActiveGate = Boolean(activeGateName);

    d3.selectAll(".feature-cell")
        .classed("is-active", d => d.name === activeGateName)
        .classed("is-muted", d => hasActiveGate && d.name !== activeGateName);

    d3.selectAll(".location-point")
        .classed("is-active", d => d.name === activeGateName)
        .classed("is-muted", d => hasActiveGate && d.name !== activeGateName);

    d3.selectAll(".location-label")
        .classed("is-visible", d => hasActiveGate && d.name === activeGateName);
}

// Tooltip
const tooltip = d3.select("#tooltip");

function renderFindings() {
    const activeFindings = activeGateName
        ? getVisibleFindings().filter(finding => finding.locations.includes(activeGateName))
        : [];
    const findingsGrid = d3.select("#findings-grid");

    if (activeFindings.length > 0) {
        findingsGrid.selectAll("p.detail-copy").remove();
    }

    const cards = findingsGrid
        .selectAll(".finding-card")
        .data(activeFindings, d => d.id);

    cards.exit().remove();

    const cardsEnter = cards.enter()
        .append("article")
        .attr("class", d => `finding-card is-${d.tone}`);

    cardsEnter.append("p").attr("class", "finding-kicker");
    cardsEnter.append("h3").attr("class", "finding-title");
    cardsEnter.append("p").attr("class", "finding-body");
    cardsEnter.append("p").attr("class", "finding-meta");

    cardsEnter.merge(cards)
        .attr("class", d => `finding-card is-${d.tone}`)
        .each(function(d) {
            const card = d3.select(this);
            card.select(".finding-kicker").text(d.category);
            card.select(".finding-title").text(d.title);
            card.select(".finding-body").text(d.body);
            card.select(".finding-meta").text(d.source);
        });

    if (activeFindings.length === 0) {
        findingsGrid.html("<p class=\"detail-copy\">Click a gate, ranger-stop, campsite, or entrance on the map to show the matching findings from your PDF slides.</p>");
    }
}

function updateDetailStatus() {
    const detailStatus = d3.select("#detailStatus");
    if (!activeGateName) {
        detailStatus
            .attr("class", "detail-status")
            .text(activeProgressFilter === "all" ? "Awaiting Selection" : `${activeProgressFilter} Focus`);
        return;
    }

    const leadFinding = getPrimaryFindingForLocation(activeGateName);
    if (!leadFinding) {
        detailStatus
            .attr("class", "detail-status")
            .text("General Evidence Site");
        return;
    }

    detailStatus
        .attr("class", `detail-status is-${leadFinding.tone}`)
        .text(`${leadFinding.category} • ${leadFinding.source.split(",")[0]}`);
}

function clearDetails() {
    activeFindingId = null;
    d3.select("#detailTitle").text("Select a Region");
    d3.select("#detailSummary").text("Choose a highlighted region on the map to inspect a curated evidence profile built from the slide findings, not a raw dump of sensor rows.");
    d3.select("#detailStatsContainer").html("");
    d3.select("#detailTableContainer").html("<p class=\"detail-copy\">No region selected.</p>");
    updateDetailStatus();
    renderFindings();
    renderFindingBoard();
}

function showGateDetails(gateName) {
    const gateRecords = parsedData.filter(d => d["gate-name"] === gateName);
    const latestRecord = gateRecords.slice().sort((a, b) => b.parsedTime - a.parsedTime)[0];
    const evidence = getEvidenceForGate(gateName);
    const preservedFinding = getVisibleFindings().find(
        finding => finding.id === activeFindingId && finding.locations.includes(gateName)
    );
    const leadFinding = preservedFinding || getPrimaryFindingForLocation(gateName);
    
    d3.select("#detailTitle").text(gateName);
    activeFindingId = leadFinding ? leadFinding.id : null;

    d3.select("#detailSummary").text(
        latestRecord
            ? `${evidence.summary} Latest detection at this location: ${formatTime(latestRecord.parsedTime)}.`
            : evidence.summary
    );

    updateDetailStatus();
    renderFindings();
    renderFindingBoard();
    renderEvidence(evidence.stats, evidence.headers, evidence.rows, evidence.emptyMessage);
}

function selectLocationByName(gateName, options = {}) {
    if (options.resetFilters) {
        d3.select("#vehicle-filter").property("value", "all");
        d3.select("#time-start").property("value", 0);
        d3.select("#time-end").property("value", 23);
        updateTimeDisplay();
        updateVisualizations();
        activeFindingId = options.findingId || null;
    }

    const featureNode = d3.selectAll(".feature-cell").filter(d => d.name === gateName).node();
    if (!featureNode) {
        return;
    }
    activeGateName = gateName;
    updateActiveLocationStyles();
    zoomToFeature(featureNode);
    showGateDetails(gateName);
}

// Load data
d3.csv(csvFile).then(data => {
    fullData = data;
    parsedData = data.map(d => {
        const parsedTime = new Date(d.Timestamp);
        return {
            ...d,
            parsedTime,
            hour: parsedTime.getHours(),
            dayName: dayNames[parsedTime.getDay()]
        };
    });
    sessionSummaries = buildSessionSummaries(parsedData);
    renderProgressFilters();
    renderOverviewChips();
    clearDetails();
    updateVisualizations();
    setupControls();
}).catch(error => {
    console.error("Error loading data:", error);
    alert("Error loading CSV file. Check console.");
});

function formatHourLabel(hour, minuteLabel) {
    return `${String(hour).padStart(2, "0")}:${minuteLabel}`;
}

function getTimeWindow() {
    const startHour = +d3.select("#time-start").property("value");
    const endHour = +d3.select("#time-end").property("value");
    return {
        startHour,
        endHour,
        isAllHours: startHour === 0 && endHour === 23
    };
}

function updateTimeWindowFill() {
    const { startHour, endHour } = getTimeWindow();
    const fill = d3.select("#time-window-fill");
    const min = 0;
    const max = 23;
    const leftPercent = ((startHour - min) / (max - min)) * 100;
    const rightPercent = ((endHour - min) / (max - min)) * 100;

    fill.style("left", `${leftPercent}%`);
    fill.style("width", `${Math.max(rightPercent - leftPercent, 0)}%`);
}

function updateTimeDisplay() {
    const { startHour, endHour, isAllHours } = getTimeWindow();
    updateTimeWindowFill();
    d3.select("#time-display").text(
        isAllHours
            ? "All Hours"
            : `${formatHourLabel(startHour, "00")} - ${formatHourLabel(endHour, "59")}`
    );
}

function setupControls() {
    d3.select("#vehicle-filter").on("change", updateVisualizations);
    d3.select("#time-start").on("input", function() {
        const endHour = +d3.select("#time-end").property("value");
        const nextStart = Math.min(+this.value, endHour);
        d3.select(this).property("value", nextStart);
        updateTimeDisplay();
        updateVisualizations();
    });
    d3.select("#time-end").on("input", function() {
        const startHour = +d3.select("#time-start").property("value");
        const nextEnd = Math.max(+this.value, startHour);
        d3.select(this).property("value", nextEnd);
        updateTimeDisplay();
        updateVisualizations();
    });
    d3.select("#reset-btn").on("click", () => {
        d3.select("#vehicle-filter").property("value", "all");
        d3.select("#time-start").property("value", 0);
        d3.select("#time-end").property("value", 23);
        updateTimeDisplay();
        updateVisualizations();
    });
    updateTimeDisplay();
}

function filterData() {
    const vehicleFilter = d3.select("#vehicle-filter").property("value");
    const { startHour, endHour, isAllHours } = getTimeWindow();
    
    filteredData = parsedData.filter(d => {
        const matches_vehicle = vehicleFilter === "all" || d["car-type"] === vehicleFilter;
        const matches_time = isAllHours || (d.hour >= startHour && d.hour <= endHour);
        return matches_vehicle && matches_time;
    });
    
    return filteredData;
}

function updateVisualizations() {
    filterData();
    activeGateName = null;
    renderProgressFilters();
    renderOverviewChips();
    clearDetails();
    updateStats();
    updateHeatMap();
}

function updateStats() {
    const vehicleFilter = d3.select("#vehicle-filter").property("value");
    const totalRecords = vehicleFilter === "all" 
        ? parsedData.length 
        : parsedData.filter(d => d["car-type"] === vehicleFilter).length;
    
    const uniqueLocations = new Set(parsedData.map(d => d["gate-name"])).size;
    const uniqueVehicles = new Set(parsedData.map(d => d["car-id"])).size;
    const timeRangeData = filterData();
    const filteredCount = timeRangeData.length;
    
    const stats = [
        { label: "Total Vehicles", value: totalRecords },
        { label: "Unique Locations", value: uniqueLocations },
        { label: "Unique Car IDs", value: uniqueVehicles },
        { label: "Filtered Records", value: filteredCount }
    ];
    
    const statsDiv = d3.select("#stats-container").selectAll(".stat-box").data(stats);
    statsDiv.exit().remove();
    
    statsDiv.enter().append("div")
        .attr("class", (d, i) => "stat-box" + (i > 0 ? " alt" + i : ""))
        .merge(statsDiv)
        .html(d => `<div class="stat-value">${d.value.toLocaleString()}</div><div class="stat-label">${d.label}</div>`);
}

function updateHeatMap() {
    const locationData = d3.rollup(filteredData, v => v.length, d => d["gate-name"]);
    const maxCount = d3.max(Array.from(locationData.values())) || 1;
    const radiusScale = d3.scaleSqrt().domain([0, maxCount]).range([3, 25]);
    
    const mapContainer = d3.select("#map-container");
    mapContainer.selectAll("svg").remove();
    
    const svg = mapContainer.append("svg")
        .attr("width", mapWidth)
        .attr("height", mapHeight)
        .attr("viewBox", `0 0 ${mapWidth} ${mapHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("class", "map-svg");

    svgSelection = svg;
    currentZoom = d3.zoomIdentity;

    svg.append("rect")
        .attr("class", "map-background")
        .attr("width", mapWidth)
        .attr("height", mapHeight)
        .on("click", resetZoom);

    const g = svg.append("g");
    g.attr("class", "map-layer");

    zoomBehavior = d3.zoom()
        .scaleExtent([1, maxZoomScale])
        .extent([[0, 0], [mapWidth, mapHeight]])
        .translateExtent([[0, 0], [mapWidth, mapHeight]])
        .on("zoom", (event) => {
            currentZoom = event.transform;
            g.attr("transform", currentZoom);
            g.style("stroke-width", `${1.5 / currentZoom.k}px`);
            d3.select("#zoomResetBtn").property("disabled", isDefaultZoom(currentZoom));
        });

    svg.call(zoomBehavior).on("dblclick.zoom", null);
    
    g.append("image")
        .attr("href", mapImage)
        .attr("width", mapWidth)
        .attr("height", mapHeight)
        .attr("opacity", 0.8)
        .style("pointer-events", "none");
    
    const locations = Array.from(locationData, ([name, count]) => ({
        name, count, coord: coords[name], tone: getLocationTone(name)
    })).filter(d => d.coord && d.count > 0);

    if (locations.length === 0) {
        svg.append("text")
            .attr("x", mapWidth / 2)
            .attr("y", mapHeight / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#64748b")
            .style("font-size", "18px")
            .text("No locations match this filter.");
        d3.select("#zoomResetBtn").property("disabled", true);
        return;
    }

    const delaunay = d3.Delaunay.from(locations, d => d.coord.x, d => d.coord.y);
    const voronoi = delaunay.voronoi([0, 0, mapWidth, mapHeight]);
    const features = locations.map((d, index) => ({
        ...d,
        polygon: voronoi.cellPolygon(index)
    })).filter(d => d.polygon);

    const polygonPath = polygon => `M${polygon.map(point => point.join(",")).join("L")}Z`;

    g.selectAll(".signal-ring")
        .data(locations.filter(d => d.tone && d.tone !== "context"))
        .enter()
        .append("circle")
        .attr("class", d => `signal-ring tone-${d.tone}`)
        .attr("cx", d => d.coord.x)
        .attr("cy", d => d.coord.y)
        .attr("r", d => radiusScale(d.count) + 10);
    
    g.selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("class", d => `feature-cell${d.tone ? ` tone-${d.tone}` : ""}`)
        .attr("d", d => polygonPath(d.polygon))
        .on("click", (event, d) => {
            event.stopPropagation();

            if (activeGateName === d.name) {
                resetZoom();
                return;
            }

            activeGateName = d.name;
            updateActiveLocationStyles();
            zoomToFeature(event.currentTarget);
            showGateDetails(d.name);
        })
        .on("mouseover", (event, d) => {
            const toneLabel = d.tone ? d.tone.charAt(0).toUpperCase() + d.tone.slice(1) : "General";
            tooltip.style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px")
                .html(`<strong>${d.name}</strong><br/>${toneLabel} evidence site<br/>${d.count} filtered vehicles<br/><em>Click to inspect evidence</em>`);
        })
        .on("mouseout", () => tooltip.style("display", "none"));

    g.selectAll("circle")
        .data(locations)
        .enter()
        .append("circle")
        .attr("cx", d => d.coord.x)
        .attr("cy", d => d.coord.y)
        .attr("r", d => radiusScale(d.count))
        .attr("class", d => `circle-clickable location-point${d.tone ? ` tone-${d.tone}` : ""}`)
        .style("pointer-events", "none");

    g.selectAll("text")
        .data(locations)
        .enter()
        .append("text")
        .attr("class", "location-label")
        .attr("x", d => d.coord.x)
        .attr("y", d => d.coord.y - radiusScale(d.count) - 8)
        .attr("text-anchor", "middle")
        .text(d => d.name);

    updateActiveLocationStyles();
    d3.select("#zoomResetBtn").on("click", resetZoom);
}

function zoomToFeature(targetNode) {
    if (!targetNode || !svgSelection || !zoomBehavior) return;

    const bounds = targetNode.getBBox();
    const dx = Math.max(bounds.width + zoomPadding * 2, minFocusBoxSize);
    const dy = Math.max(bounds.height + zoomPadding * 2, minFocusBoxSize);
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    const scale = Math.max(1, Math.min(maxZoomScale, 0.9 / Math.max(dx / mapWidth, dy / mapHeight)));

    const transform = d3.zoomIdentity
        .translate(mapWidth / 2, mapHeight / 2)
        .scale(scale)
        .translate(-x, -y);

    svgSelection.transition()
        .duration(zoomDuration)
        .call(zoomBehavior.transform, transform);
}

function resetZoom() {
    activeGateName = null;
    updateActiveLocationStyles();
    clearDetails();

    if (!svgSelection || !zoomBehavior) return;

    svgSelection.transition()
        .duration(zoomDuration)
        .call(zoomBehavior.transform, d3.zoomIdentity);
}

function updateHourlyChart() {
    const hourlyData = Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        count: fullData.filter(d => new Date(d.Timestamp).getHours() === h).length
    }));
    
    const container = d3.select("#hourly-container");
    container.selectAll("svg").remove();
    
    const margin = { top: 20, right: 20, bottom: 30, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleBand().domain(d3.range(24)).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(hourlyData, d => d.count)]).range([height, 0]);
    
    svg.selectAll("rect")
        .data(hourlyData)
        .enter()
        .append("rect")
        .attr("x", d => x(d.hour))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#3498db")
        .attr("opacity", 0.7)
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px")
                .text(`Hour ${d.hour}: ${d.count} vehicles`);
        })
        .on("mouseout", () => tooltip.style("display", "none"));
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d => d + ":00"));
    
    svg.append("g")
        .call(d3.axisLeft(y).ticks(5));
}

function updateVehicleChart() {
    const vehicleData = d3.rollup(fullData, v => v.length, d => d["car-type"]);
    const data = Array.from(vehicleData, ([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);
    
    const container = d3.select("#vehicle-container");
    container.selectAll("svg").remove();
    
    const margin = { top: 20, right: 20, bottom: 30, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.count)]).range([0, width]);
    const y = d3.scaleBand().domain(data.map(d => "Type " + d.type)).range([0, height]);
    
    const colors = d3.scaleOrdinal().domain(data.map(d => d.type)).range(d3.schemeSet2);
    
    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => y(data[i].type ? "Type " + data[i].type : "Unknown"))
        .attr("width", d => x(d.count))
        .attr("height", y.bandwidth())
        .attr("fill", (d, i) => colors(i))
        .attr("opacity", 0.7);
    
    svg.append("g")
        .call(d3.axisLeft(y));
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5));
}

function updateHotspots() {
    const hotspotData = d3.rollup(fullData, v => v.length, d => d["gate-name"]);
    const top10 = Array.from(hotspotData, ([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    
    const container = d3.select("#hotspot-container");
    container.selectAll("svg").remove();
    
    const margin = { top: 20, right: 20, bottom: 80, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleBand().domain(top10.map(d => d.name)).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(top10, d => d.count)]).range([height, 0]);
    
    svg.selectAll("rect")
        .data(top10)
        .enter()
        .append("rect")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#e74c3c")
        .attr("opacity", 0.7);
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end");
    
    svg.append("g")
        .call(d3.axisLeft(y).ticks(5));
}

function updateAnomalies() {
    const locationData = d3.rollup(fullData, v => v.length, d => d["gate-name"]);
    const stats = Array.from(locationData.values());
    const mean = stats.reduce((a, b) => a + b) / stats.length;
    const std = Math.sqrt(stats.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / stats.length);
    const threshold = mean + 2 * std;
    
    const anomalies = Array.from(locationData, ([name, count]) => ({ name, count }))
        .filter(d => d.count > threshold)
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    
    const container = d3.select("#anomaly-container");
    container.selectAll("svg").remove();
    
    if (anomalies.length === 0) {
        container.append("p").text("No anomalies detected (normal traffic patterns)").style("color", "#27ae60");
        return;
    }
    
    const margin = { top: 20, right: 20, bottom: 80, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleBand().domain(anomalies.map(d => d.name)).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(anomalies, d => d.count)]).range([height, 0]);
    
    svg.selectAll("rect")
        .data(anomalies)
        .enter()
        .append("rect")
        .attr("x", d => x(d.name))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#f39c12")
        .attr("opacity", 0.7);
    
    svg.append("line")
        .attr("x1", 0).attr("x2", width)
        .attr("y1", y(threshold)).attr("y2", y(threshold))
        .attr("stroke", "#e74c3c")
        .attr("stroke-dasharray", "5,5")
        .attr("stroke-width", 2);
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end");
    
    svg.append("g")
        .call(d3.axisLeft(y).ticks(5));
}

function updateRouteFlow() {
    const routeFlows = {};
    
    fullData.forEach(d => {
        const key = d["car-id"];
        if (!routeFlows[key]) routeFlows[key] = [];
        routeFlows[key].push({
            gate: d["gate-name"],
            time: new Date(d.Timestamp)
        });
    });
    
    Object.values(routeFlows).forEach(stops => {
        stops.sort((a, b) => a.time - b.time);
    });
    
    const routes = {};
    Object.values(routeFlows).forEach(stops => {
        if (stops.length > 1) {
            for (let i = 0; i < stops.length - 1; i++) {
                const route = stops[i].gate + " → " + stops[i + 1].gate;
                routes[route] = (routes[route] || 0) + 1;
            }
        }
    });
    
    const topRoutes = Object.entries(routes)
        .map(([route, count]) => ({ route, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
    
    const container = d3.select("#route-container");
    container.selectAll("svg").remove();
    
    const margin = { top: 20, right: 20, bottom: 80, left: 60 };
    const width = 500 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleBand().domain(topRoutes.map(d => d.route)).range([0, width]);
    const y = d3.scaleLinear().domain([0, d3.max(topRoutes, d => d.count)]).range([height, 0]);
    
    svg.selectAll("rect")
        .data(topRoutes)
        .enter()
        .append("rect")
        .attr("x", d => x(d.route))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d.count))
        .attr("fill", "#9b59b6")
        .attr("opacity", 0.7);
    
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("text-anchor", "end")
        .style("font-size", "11px");
    
    svg.append("g")
        .call(d3.axisLeft(y).ticks(5));
}
