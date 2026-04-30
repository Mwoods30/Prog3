// Configuration
const mapImage = "reserve-map.jpg";
const csvFile = "Lekagul Sensor Data.csv";
const mapWidth = 600;
const mapHeight = 600;
const scale = 600 / 982;

const coords = Object.fromEntries(`
entrance0 307 69; entrance1 88 332; entrance2 897 429; entrance3 566 818; entrance4 688 902
general-gate0 542 49; general-gate1 317 128; general-gate2 512 161; general-gate3 911 273; general-gate4 341 483; general-gate5 612 546; general-gate6 620 673; general-gate7 322 707
ranger-stop0 439 83; ranger-stop1 98 123; ranger-stop2 436 185; ranger-stop3 727 225; ranger-stop4 93 469; ranger-stop5 741 580; ranger-stop6 605 722; ranger-stop7 493 746; ranger-base 629 858
camping0 259 205; camping1 636 250; camping2 220 318; camping3 238 337; camping4 239 440; camping5 103 595; camping6 735 868; camping7 887 711; camping8 897 239
gate0 313 167; gate1 308 220; gate2 123 269; gate3 731 298; gate4 805 561; gate5 653 711; gate6 570 741; gate7 478 785; gate8 678 886
`.trim().split(/[;\n]+/).map(row => {
    const [name, x, y] = row.trim().split(/\s+/);
    return [name, { x: +x * scale, y: +y * scale }];
}));

const findings = [
    ["dumping-route", "Critical", "Suspected dumping centers on Ranger-Stop 3", "The most concerning records repeatedly connect restricted gates with Ranger-Stop 3. Nearby Camping 1 has lower visitor activity than expected, which makes the area stand out as a potential environmental impact zone.", "Restricted route pattern", "ranger-stop3,camping1", "gate3,ranger-stop3,camping1"],
    ["night-window", "Critical", "Suspicious traffic concentrates Tuesday and Thursday, 2am-5am", "The overnight window is unusually specific: suspicious restricted-area traffic clusters on Tuesday and Thursday between 2am and 5am, outside the normal visitor and ranger activity pattern.", "Time-of-day pattern", "ranger-stop3,gate3,gate5,gate6", "gate3,ranger-stop3,gate5,gate6"],
    ["restricted-route", "Critical", "One restricted route repeats 23 times", "A single non-ranger route appears 23 times through the restricted gate network. The repeated path and same-entrance return pattern make it much less likely to be normal recreation traffic.", "Route repetition", "gate3,gate5,gate6,ranger-stop3", "gate3,ranger-stop3,gate5,gate6"],
    ["truck-rs", "Critical", "Heavy trucks are the strongest suspect vehicle type", "Type 4 heavy trucks repeatedly appear near ranger-stop sensors and restricted gates. Their timing and location make them the most important vehicle type to inspect first.", "Vehicle type pattern", "ranger-stop3,ranger-stop6", "ranger-stop3,gate5,ranger-stop6"],
    ["gate-breach", "Warning", "Restricted gate traffic includes unauthorized heavy trucks", "Non-ranger Type 4 vehicles appear at Gates 3, 5, and 6 and near Ranger-Stops 3 and 6. Those locations are restricted, so this traffic needs explanation.", "Restricted access pattern", "gate3,gate5,gate6,ranger-stop3,ranger-stop6", "gate3,ranger-stop3,gate5,gate6,ranger-stop6"],
    ["sensor-gap", "Warning", "Ranger-Stop 1 shows a possible sensor gap", "Type 1 vehicles appear at Ranger-Stop 1 without matching Gate 2 records, even though Gate 2 should be part of that route. That mismatch suggests a bypass, missing detection, or data-quality issue.", "Sensor consistency check", "ranger-stop1,gate2", "gate2,ranger-stop1"],
    ["multi-day-stays", "Context", "Some non-camping visits last multiple days", "Several vehicle IDs stay inside the preserve for four to five days without camping detections. These records look more like work, maintenance, or conservation activity than ordinary visits.", "Session duration pattern", "entrance0,entrance1,entrance2,entrance3,entrance4", ""],
    ["ranger-baseline", "Context", "Ranger vehicles define the normal patrol baseline", "Ranger traffic is concentrated around ranger-stops and the ranger base during daytime operating hours. That baseline makes the late-night non-ranger records easier to separate from normal operations.", "Ranger baseline", "ranger-base,ranger-stop0,ranger-stop1,ranger-stop2,ranger-stop3,ranger-stop4,ranger-stop5,ranger-stop6,ranger-stop7", ""],
    ["may-ranger-drop", "Context", "Ranger activity drops sharply in May", "Ranger detections fall noticeably during May in multiple years. This may reflect staffing, seasonal assignment changes, or gaps in patrol coverage.", "Monthly ranger pattern", "ranger-base", ""],
    ["summer-bus-traffic", "Context", "Summer traffic peaks in July", "Preserve traffic rises in summer, especially in July. Bus and coach records also increase, suggesting a regular seasonal travel pattern separate from the restricted-area anomaly.", "Seasonal traffic pattern", "camping0,camping1,camping2,camping3,camping4,camping5,camping6,camping7,camping8", ""]
].map(([id, category, title, body, source, locations, route]) => ({
    id,
    category,
    tone: category.toLowerCase(),
    title,
    body,
    source,
    locations: locations.split(","),
    route: route ? route.split(",") : []
}));

// Global state
let parsedData = [];
let filteredData = [];
let currentZoom = d3.zoomIdentity;
let svgSelection = null;
let zoomBehavior = null;
let activeGateName = null;
let sessionSummaries = [];
let activeFindingId = null;
let activeVehicleTypes = new Set(["all"]);

const zoomDuration = 750;
const zoomPadding = 32;
const minFocusBoxSize = 120;
const maxZoomScale = 8;
const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const riskWindowDays = new Set(["Tuesday", "Thursday"]);
const toneColors = { critical: "#e11d48", warning: "#f59e0b", context: "#14b8a6" };
const vehicleTypes = [
    { id: "1", label: "Type 1", description: "Cars", color: "#2563eb" },
    { id: "2", label: "Type 2", description: "Vans", color: "#e11d48" },
    { id: "2P", label: "Type 2P", description: "Ranger vans", color: "#7c3aed" },
    { id: "3", label: "Type 3", description: "Minibus", color: "#14b8a6" },
    { id: "4", label: "Type 4", description: "Heavy trucks", color: "#f59e0b" },
    { id: "5", label: "Type 5", description: "Coach buses", color: "#64748b" },
    { id: "6", label: "Type 6", description: "Articulated trucks", color: "#0f172a" }
];
const locationRules = [
    ["camping", "camping", "C"],
    ["entrance", "entrance", "E"],
    ["ranger-stop", "ranger", "R"],
    ["general-gate", "general", "GG"],
    ["gate", "restricted", "G"]
];

function toneRank(tone) {
    return { critical: 3, warning: 2, context: 1 }[tone] || 0;
}

function isRiskWindow(d) {
    return riskWindowDays.has(d.dayName) && d.hour >= 2 && d.hour < 5;
}

function gateRecords(gateName, rows = parsedData) {
    return rows.filter(d => d["gate-name"] === gateName);
}

function countUnique(rows, key = "car-id") {
    return new Set(rows.map(d => d[key])).size;
}

function percent(count, total) {
    return total ? `${((count / total) * 100).toFixed(1)}%` : "0%";
}

function codeCell(value) {
    return `<code style="background: #f3f4f6; color: #111827; padding: 2px 6px; border-radius: 3px;">${value}</code>`;
}

function typeCell(type) {
    return `<strong>Type ${type}</strong>`;
}

function getVehicleType(typeId) {
    return vehicleTypes.find(type => type.id === typeId);
}

function resetVehicleFilter() {
    activeVehicleTypes = new Set(["all"]);
    renderVehicleFilterControls();
}

function getVehicleFilterLabel() {
    if (activeVehicleTypes.has("all")) {
        return "All Vehicle Records";
    }

    const selected = vehicleTypes.filter(type => activeVehicleTypes.has(type.id));
    if (selected.length === 1) {
        return `${selected[0].label} Records`;
    }

    return `${selected.length} Vehicle Types`;
}

function renderVehicleFilterControls() {
    const typeCounts = d3.rollup(parsedData, rows => rows.length, d => d["car-type"]);
    const options = [
        {
            id: "all",
            label: "All",
            description: "Every vehicle",
            count: parsedData.length,
            color: "#111827"
        },
        ...vehicleTypes.map(type => ({
            ...type,
            count: typeCounts.get(type.id) || 0
        }))
    ];

    const buttons = d3.select("#vehicle-filter-options")
        .selectAll(".vehicle-chip")
        .data(options, d => d.id);

    buttons.exit().remove();

    const buttonsEnter = buttons.enter()
        .append("button")
        .attr("type", "button")
        .attr("class", "vehicle-chip")
        .on("click", (_, d) => {
            if (d.id === "all") {
                activeVehicleTypes = new Set(["all"]);
            } else {
                activeVehicleTypes.delete("all");
                if (activeVehicleTypes.has(d.id)) {
                    activeVehicleTypes.delete(d.id);
                } else {
                    activeVehicleTypes.add(d.id);
                }
                if (activeVehicleTypes.size === 0) {
                    activeVehicleTypes.add("all");
                }
            }

            updateVisualizations();
        });

    buttonsEnter.append("span").attr("class", "vehicle-chip-main");
    buttonsEnter.append("span").attr("class", "vehicle-chip-detail");
    buttonsEnter.append("span").attr("class", "vehicle-chip-count");

    buttonsEnter.merge(buttons)
        .attr("class", d => `vehicle-chip${activeVehicleTypes.has(d.id) ? " is-active" : ""}`)
        .style("--chip-color", d => d.color)
        .attr("aria-pressed", d => activeVehicleTypes.has(d.id) ? "true" : "false")
        .each(function(d) {
            const chip = d3.select(this);
            chip.select(".vehicle-chip-main").text(d.label);
            chip.select(".vehicle-chip-detail").text(d.description);
            chip.select(".vehicle-chip-count").text(formatMetricValue(d.count));
        });
}

function getVisibleFindings() {
    return findings;
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
        { value: parsedData.length, label: "Sensor Records" },
        { value: countUnique(parsedData), label: "Vehicle IDs" },
        { value: criticalLocations.size, label: "Critical Locations" },
        { value: uniqueLocations.size, label: "Mapped Pattern Sites" }
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
            chip.select("strong").text(formatMetricValue(d.value));
            chip.select("span").text(d.label);
        });
}

function getPrimaryFindingForLocation(locationName) {
    return getVisibleFindings()
        .filter(finding => finding.locations.includes(locationName))
        .sort((a, b) => toneRank(b.tone) - toneRank(a.tone))[0] || null;
}

function getActiveRouteFinding() {
    if (activeFindingId) {
        const explicitFinding = getVisibleFindings().find(finding => finding.id === activeFindingId && finding.route.length);
        if (explicitFinding) {
            return explicitFinding;
        }
    }

    if (!activeGateName) {
        return null;
    }

    return getVisibleFindings()
        .filter(finding => finding.route.length && finding.locations.includes(activeGateName))
        .sort((a, b) => toneRank(b.tone) - toneRank(a.tone))[0] || null;
}

function getSiteType(locationName) {
    if (locationName === "ranger-base") return "base";
    return locationRules.find(([prefix]) => locationName.startsWith(prefix))?.[1] || "site";
}

function getMarkerCode(locationName) {
    if (locationName === "ranger-base") return "RB";
    const rule = locationRules.find(([prefix]) => locationName.startsWith(prefix));
    if (rule) return `${rule[2]}${locationName.replace(rule[0], "")}`;
    return locationName.slice(0, 2).toUpperCase();
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
            card.select(".board-source").text(d.source);
            card.select(".board-tone")
                .attr("class", `board-tone is-${d.tone}`)
                .text(d.category);
            card.select(".board-title").text(d.title);
            card.select(".board-body").text(d.body);
            card.select(".board-locations").html(`<strong>Locations:</strong> ${d.locations.slice(0, 4).join(", ")}${d.locations.length > 4 ? " ..." : ""}`);
        });

    if (!boardFindings.length) {
        board.html("<p class=\"detail-copy\">No patterns are available for the current data.</p>");
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
    const records = gateRecords(gateName);
    const nonRanger = records.filter(d => !isRangerVehicle(d["car-type"]));
    const heavyTruck = nonRanger.filter(d => String(d["car-type"]) === "4");
    const overnight = nonRanger.filter(isRiskWindow);

    const grouped = d3.rollups(nonRanger, rows => ({
        carType: rows[0]["car-type"],
        visits: rows.length,
        overnightVisits: rows.filter(isRiskWindow).length,
        firstSeen: d3.min(rows, d => d.parsedTime),
        lastSeen: d3.max(rows, d => d.parsedTime)
    }), d => d["car-id"])
        .sort((a, b) => (b[1].overnightVisits - a[1].overnightVisits) || (b[1].visits - a[1].visits))
        .slice(0, 8);

    return {
        summary: `This is a restricted-access location, so the table focuses on non-ranger records and the Tuesday/Thursday overnight window where suspicious traffic is concentrated.`,
        stats: [
            { label: "Non-Ranger Visits", value: nonRanger.length },
            { label: "Heavy Truck Visits", value: heavyTruck.length },
            { label: "Tue/Thu 2-5am Visits", value: overnight.length },
            { label: "Suspicious Vehicle IDs", value: grouped.length }
        ],
        headers: ["Vehicle ID", "Type", "Visits", "Tue/Thu 2-5am", "First Seen", "Last Seen"],
        rows: grouped.map(([carId, info]) => [
            codeCell(carId),
            typeCell(info.carType),
            info.visits.toLocaleString(),
            info.overnightVisits.toLocaleString(),
            formatTime(info.firstSeen),
            formatTime(info.lastSeen)
        ]),
        emptyMessage: "No suspicious non-ranger records were found for this restricted location."
    };
}

function buildSensorGapEvidence() {
    const stopRecords = gateRecords("ranger-stop1").filter(d => String(d["car-type"]) === "1");
    const gate2Ids = new Set(gateRecords("gate2")
        .filter(d => String(d["car-type"]) === "1")
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
        summary: `This view checks for a sensor-consistency problem: Type 1 vehicles appear at Ranger-Stop 1 without matching Gate 2 detections, so the table shows the unmatched examples.`,
        stats: [
            { label: "Type 1 at Stop 1", value: stopRecords.length },
            { label: "Unmatched Gate 2 IDs", value: grouped.length },
            { label: "Unmatched July Detections", value: julyCount },
            { label: "Matching Gate 2 IDs", value: gate2Ids.size }
        ],
        headers: ["Vehicle ID", "Visits at Stop 1", "July Visits", "First Seen", "Last Seen"],
        rows: grouped.map(([carId, info]) => [
            codeCell(carId),
            info.visits.toLocaleString(),
            info.julyVisits.toLocaleString(),
            formatTime(info.firstSeen),
            formatTime(info.lastSeen)
        ]),
        emptyMessage: "No unmatched type 1 records were found for the Ranger-Stop 1 / Gate 2 anomaly."
    };
}

function buildCampingEvidence(gateName) {
    const records = gateRecords(gateName);
    const monthly = d3.rollups(records, rows => rows.length, d => monthKey(d.parsedTime))
        .sort((a, b) => a[0].localeCompare(b[0]));
    const summerCount = records.filter(d => [5, 6, 7].includes(d.parsedTime.getMonth())).length;
    const julyCount = records.filter(d => d.parsedTime.getMonth() === 6).length;

    const campsiteTotals = d3.rollups(parsedData.filter(d => d["gate-name"].startsWith("camping")), rows => rows.length, d => d["gate-name"])
        .sort((a, b) => a[1] - b[1]);
    const rank = campsiteTotals.findIndex(([name]) => name === gateName) + 1;

    return {
        summary: gateName === "camping1"
            ? `Camping 1 is near the Ranger-Stop 3 anomaly, so this view emphasizes whether campsite traffic is unusually low during busy months.`
            : `This campsite view shows month-level traffic and bus activity so seasonal demand is easier to read than a raw list of detections.`,
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
                percent(count, records.length)
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
        summary: `This entrance view isolates long-duration sessions. Multi-day entries without camping stops are more useful for pattern analysis than every single entrance crossing.`,
        stats: [
            { label: "24h+ Sessions", value: sessions.length },
            { label: "4-5 Day Sessions", value: multiDay.length },
            { label: "Recurring Vehicle IDs", value: recurringIds },
            { label: "Average Multi-Day Stay", value: `${avgDurationDays.toFixed(1)} days` }
        ],
        headers: ["Vehicle ID", "Type", "Start", "End", "Duration", "Route Snapshot"],
        rows: multiDay.slice(0, 8).map(session => [
            codeCell(session.carId),
            typeCell(session.carType),
            formatTime(session.startTime),
            formatTime(session.endTime),
            `${(session.durationHours / 24).toFixed(1)} days`,
            session.route.slice(0, 5).join(" → ")
        ]),
        emptyMessage: "No long-duration sessions were found for this entrance."
    };
}

function buildRangerEvidence(gateName) {
    const records = gateRecords(gateName).filter(d => isRangerVehicle(d["car-type"]));
    const overnight = records.filter(d => d.hour < 6 || d.hour >= 20).length;
    const peakHourEntry = d3.greatest(
        d3.rollups(records, rows => rows.length, d => d.hour),
        d => d[1]
    );
    const hourlyRows = d3.rollups(records, rows => rows.length, d => d.hour)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

    return {
        summary: `Ranger traffic is the baseline for normal preserve operations, so this panel focuses on ranger-only operating hours and hourly concentration.`,
        stats: [
            { label: "Ranger Detections", value: records.length },
            { label: "Nighttime Share", value: percent(overnight, records.length) },
            { label: "Unique Ranger IDs", value: countUnique(records) },
            { label: "Peak Hour", value: peakHourEntry ? `${peakHourEntry[0]}:00` : "N/A" }
        ],
        headers: ["Hour", "Ranger Detections", "Share of Ranger Traffic"],
        rows: hourlyRows.map(([hour, count]) => [
            `${String(hour).padStart(2, "0")}:00`,
            count.toLocaleString(),
            percent(count, records.length)
        ]),
        emptyMessage: "No ranger-vehicle detections were found for this location."
    };
}

function buildGenericEvidence(gateName) {
    const records = gateRecords(gateName);
    const byType = d3.rollups(records, rows => rows.length, d => d["car-type"])
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
    const byHour = d3.rollups(records, rows => rows.length, d => d.hour)
        .sort((a, b) => b[1] - a[1])[0];

    return {
        summary: `This location does not have a flagged anomaly, so the panel shows a compact traffic profile by vehicle type and peak hour.`,
        stats: [
            { label: "Total Detections", value: records.length },
            { label: "Unique Vehicle IDs", value: countUnique(records) },
            { label: "Vehicle Types Present", value: countUnique(records, "car-type") },
            { label: "Peak Hour", value: byHour ? `${byHour[0]}:00` : "N/A" }
        ],
        headers: ["Vehicle Type", "Detections", "Share of Total"],
        rows: byType.map(([type, count]) => [
            typeCell(type),
            count.toLocaleString(),
            percent(count, records.length)
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

function drawActiveRoute(g) {
    const routeFinding = getActiveRouteFinding();
    if (!routeFinding) {
        g.selectAll(".route-overlay").remove();
        return;
    }

    const routePoints = routeFinding.route
        .map(name => ({ name, coord: coords[name] }))
        .filter(point => point.coord);

    if (routePoints.length < 2) {
        g.selectAll(".route-overlay").remove();
        return;
    }

    const routeLayer = g.selectAll(".route-overlay")
        .data([routeFinding], d => d.id)
        .join(enter => enter.append("g").attr("class", "route-overlay"));

    routeLayer.selectAll("*").remove();

    const line = d3.line()
        .x(d => d.coord.x)
        .y(d => d.coord.y)
        .curve(d3.curveCatmullRom.alpha(0.45));

    routeLayer.append("path")
        .datum(routePoints)
        .attr("class", "route-line route-line-halo")
        .attr("d", line);

    routeLayer.append("path")
        .datum(routePoints)
        .attr("class", "route-line")
        .attr("d", line);

    routeLayer.selectAll(".route-stop")
        .data(routePoints)
        .enter()
        .append("circle")
        .attr("class", "route-stop")
        .attr("cx", d => d.coord.x)
        .attr("cy", d => d.coord.y)
        .attr("r", 7);

    routeLayer.selectAll(".route-index")
        .data(routePoints)
        .enter()
        .append("text")
        .attr("class", "route-index")
        .attr("x", d => d.coord.x)
        .attr("y", d => d.coord.y + 3)
        .attr("text-anchor", "middle")
        .text((_, index) => index + 1);

    routeLayer.append("text")
        .attr("class", "route-caption")
        .attr("x", routePoints[0].coord.x)
        .attr("y", routePoints[0].coord.y - 18)
        .text(routeFinding.source);
}

function isDefaultZoom(transform) {
    return Math.abs(transform.k - 1) < 0.001 &&
        Math.abs(transform.x) < 0.5 &&
        Math.abs(transform.y) < 0.5;
}

function updateActiveLocationStyles() {
    const hasActiveGate = Boolean(activeGateName);
    const routeFinding = getActiveRouteFinding();
    const routeLocations = new Set(routeFinding?.route || []);

    d3.selectAll(".feature-cell")
        .classed("is-active", d => d.name === activeGateName)
        .classed("is-route", d => routeLocations.has(d.name))
        .classed("is-muted", d => hasActiveGate && d.name !== activeGateName);

    d3.selectAll(".location-marker")
        .classed("is-active", d => d.name === activeGateName)
        .classed("is-route", d => routeLocations.has(d.name))
        .classed("is-muted", d => hasActiveGate && d.name !== activeGateName);

    d3.selectAll(".location-code")
        .classed("is-active", d => d.name === activeGateName)
        .classed("is-route", d => routeLocations.has(d.name))
        .classed("is-muted", d => hasActiveGate && d.name !== activeGateName)
        .classed("is-visible", d => routeLocations.has(d.name) || (!hasActiveGate && d.siteType === "camping"));

    d3.selectAll(".location-label")
        .classed("is-visible", d => routeLocations.has(d.name) || (hasActiveGate && d.name === activeGateName));
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
        findingsGrid.html("<p class=\"detail-copy\">Click a gate, ranger-stop, campsite, or entrance on the map to show the data patterns tied to that location.</p>");
    }
}

function updateDetailStatus() {
    const detailStatus = d3.select("#detailStatus");
    if (!activeGateName) {
        detailStatus
            .attr("class", "detail-status")
            .text("Awaiting Selection");
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
        .text(`${leadFinding.category} • ${leadFinding.source}`);
}

function clearDetails() {
    activeFindingId = null;
    d3.select("#detailTitle").text("Select a Region");
    d3.select("#detailSummary").text("Choose a highlighted region on the map to inspect the sensor records, traffic mix, timing, and any anomaly patterns tied to that location.");
    d3.select("#detailStatsContainer").html("");
    d3.select("#detailTableContainer").html("<p class=\"detail-copy\">No region selected.</p>");
    updateDetailStatus();
    renderFindings();
    renderFindingBoard();
}

function showGateDetails(gateName) {
    const records = gateRecords(gateName);
    const latestRecord = records.slice().sort((a, b) => b.parsedTime - a.parsedTime)[0];
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
        resetVehicleFilter();
        d3.select("#time-start").property("value", 0);
        d3.select("#time-end").property("value", 23);
        updateTimeDisplay();
        activeFindingId = options.findingId || null;
        filterData();
        renderVehicleFilterControls();
        renderOverviewChips();
        updateStats();
        updateAnalytics();
        updateHeatMap();
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
    renderVehicleFilterControls();
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
        resetVehicleFilter();
        d3.select("#time-start").property("value", 0);
        d3.select("#time-end").property("value", 23);
        updateTimeDisplay();
        updateVisualizations();
    });
    updateTimeDisplay();
}

function filterData() {
    const { startHour, endHour, isAllHours } = getTimeWindow();
    
    filteredData = parsedData.filter(d => {
        const matches_vehicle = activeVehicleTypes.has("all") || activeVehicleTypes.has(d["car-type"]);
        const matches_time = isAllHours || (d.hour >= startHour && d.hour <= endHour);
        return matches_vehicle && matches_time;
    });
    
    return filteredData;
}

function updateVisualizations() {
    filterData();
    activeGateName = null;
    renderVehicleFilterControls();
    renderOverviewChips();
    clearDetails();
    updateStats();
    updateAnalytics();
    updateHeatMap();
}

function updateStats() {
    const selectedTypeRecords = activeVehicleTypes.has("all")
        ? parsedData.length
        : parsedData.filter(d => activeVehicleTypes.has(d["car-type"])).length;

    const timeRangeData = filterData();
    const filteredCount = timeRangeData.length;
    const filteredVehicles = countUnique(timeRangeData);
    const riskWindowCount = parsedData.filter(isRiskWindow).length;
    
    const stats = [
        { label: getVehicleFilterLabel(), value: selectedTypeRecords },
        { label: "Filtered Vehicle IDs", value: filteredVehicles },
        { label: "Tue/Thu 2-5am Records", value: riskWindowCount },
        { label: "Filtered Records", value: filteredCount }
    ];
    
    const statsDiv = d3.select("#stats-container").selectAll(".stat-box").data(stats);
    statsDiv.exit().remove();
    
    statsDiv.enter().append("div")
        .attr("class", (d, i) => "stat-box" + (i > 0 ? " alt" + i : ""))
        .merge(statsDiv)
        .html(d => `<div class="stat-value">${d.value.toLocaleString()}</div><div class="stat-label">${d.label}</div>`);
}

function formatShortCount(value) {
    return d3.format(value >= 1000 ? ".2s" : ",")(value).replace("G", "B");
}

function drawEmptyChart(container, width, height, message) {
    container.selectAll("*").remove();
    container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .append("text")
        .attr("class", "chart-empty")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .text(message);
}

function drawHorizontalBarChart({ container, width, height, margin, data, label, fill, order = "normal" }) {
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const labels = data.map(label);
    const x = d3.scaleLinear().domain([0, d3.max(data, d => d.count) || 1]).nice().range([0, innerWidth]);
    const y = d3.scaleBand()
        .domain(labels)
        .range(order === "reverse" ? [innerHeight, 0] : [0, innerHeight])
        .padding(order === "reverse" ? 0.16 : 0.18);

    container.selectAll("*").remove();
    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`);
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y).tickSize(0))
        .call(selection => selection.select(".domain").remove());

    g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).ticks(4).tickFormat(formatShortCount));

    g.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => y(label(d)))
        .attr("width", d => x(d.count))
        .attr("height", y.bandwidth())
        .attr("rx", 5)
        .attr("fill", fill)
        .attr("opacity", order === "reverse" ? 0.9 : 0.88);

    g.selectAll(".bar-value")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "chart-label")
        .attr("x", d => x(d.count) + 8)
        .attr("y", d => y(label(d)) + y.bandwidth() / 2 + 4)
        .text(d => formatShortCount(d.count));
}

function updateAnalytics() {
    updateHourDayHeatmap();
    updateVehicleMixChart();
    updateTopLocationChart();
}

function updateHourDayHeatmap() {
    const container = d3.select("#hour-day-heatmap");
    const width = 760;
    const height = 300;
    const margin = { top: 18, right: 20, bottom: 34, left: 74 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (!filteredData.length) {
        drawEmptyChart(container, width, height, "No records match the active filters.");
        return;
    }

    container.selectAll("*").remove();

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`);
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const grid = d3.rollup(filteredData, rows => rows.length, d => d.dayName, d => d.hour);
    const cells = dayNames.flatMap(day => d3.range(24).map(hour => ({
        day,
        hour,
        count: grid.get(day)?.get(hour) || 0,
        isRiskWindow: riskWindowDays.has(day) && hour >= 2 && hour < 5
    })));
    const maxCount = d3.max(cells, d => d.count) || 1;
    const x = d3.scaleBand().domain(d3.range(24)).range([0, innerWidth]).padding(0.06);
    const y = d3.scaleBand().domain(dayNames).range([0, innerHeight]).padding(0.08);
    const color = d3.scaleSequentialSqrt([0, maxCount], d3.interpolateRgbBasis(["#eff6ff", "#bfdbfe", "#60a5fa", "#1d4ed8"]));

    g.selectAll("rect")
        .data(cells)
        .enter()
        .append("rect")
        .attr("x", d => x(d.hour))
        .attr("y", d => y(d.day))
        .attr("width", x.bandwidth())
        .attr("height", y.bandwidth())
        .attr("rx", 3)
        .attr("fill", d => d.count ? color(d.count) : "#f9fafb")
        .attr("stroke", d => d.isRiskWindow ? "#111827" : "#ffffff")
        .attr("stroke-width", d => d.isRiskWindow ? 1.5 : 0.5)
        .on("mouseover", (event, d) => {
            tooltip.style("display", "block")
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`)
                .html(`<strong>${d.day} ${String(d.hour).padStart(2, "0")}:00</strong><br/>${d.count.toLocaleString()} filtered detections${d.isRiskWindow ? "<br/><em>Investigation window</em>" : ""}`);
        })
        .on("mouseout", () => tooltip.style("display", "none"));

    g.append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(d3.axisBottom(x).tickValues(d3.range(0, 24, 3)).tickFormat(d => `${d}:00`));

    g.append("g")
        .attr("class", "axis")
        .call(d3.axisLeft(y));

    svg.append("text")
        .attr("class", "chart-muted")
        .attr("x", margin.left)
        .attr("y", height - 4)
        .text(`Peak cell: ${maxCount.toLocaleString()} detections`);
}

function updateVehicleMixChart() {
    const container = d3.select("#vehicle-mix-chart");
    const width = 430;
    const height = 300;
    const margin = { top: 8, right: 54, bottom: 28, left: 84 };

    if (!filteredData.length) {
        drawEmptyChart(container, width, height, "No vehicle mix to show.");
        return;
    }

    const data = Array.from(d3.rollup(filteredData, rows => rows.length, d => d["car-type"]), ([type, count]) => ({ type, count }))
        .sort((a, b) => d3.ascending(String(a.type), String(b.type)));
    drawHorizontalBarChart({
        container,
        width,
        height,
        margin,
        data,
        label: d => getVehicleType(d.type)?.label || `Type ${d.type}`,
        fill: d => getVehicleType(d.type)?.color || "#94a3b8"
    });
}

function updateTopLocationChart() {
    const container = d3.select("#top-location-chart");
    const width = 430;
    const height = 300;
    const margin = { top: 8, right: 58, bottom: 28, left: 128 };

    if (!filteredData.length) {
        drawEmptyChart(container, width, height, "No locations match the active filters.");
        return;
    }

    const data = Array.from(d3.rollup(filteredData, rows => rows.length, d => d["gate-name"]), ([name, count]) => ({ name, count, tone: getLocationTone(name) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
        .reverse();
    drawHorizontalBarChart({
        container,
        width,
        height,
        margin,
        data,
        label: d => d.name,
        fill: d => toneColors[d.tone] || "#94a3b8",
        order: "reverse"
    });
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

    drawActiveRoute(g);
    
    const locations = Array.from(locationData, ([name, count]) => ({
        name,
        count,
        coord: coords[name],
        tone: getLocationTone(name),
        siteType: getSiteType(name),
        markerCode: getMarkerCode(name),
        radius: Math.max(6, Math.min(14, radiusScale(count) * 0.68))
    })).filter(d => d.coord && d.count > 0);

    const layoutLocations = locations.map(d => ({
        ...d,
        x: d.coord.x,
        y: d.coord.y,
        targetX: d.coord.x,
        targetY: d.coord.y
    }));

    d3.forceSimulation(layoutLocations)
        .force("x", d3.forceX(d => d.targetX).strength(0.18))
        .force("y", d3.forceY(d => d.targetY).strength(0.18))
        .force("collide", d3.forceCollide(d => d.radius + 3).iterations(4))
        .stop()
        .tick(180);

    layoutLocations.forEach(d => {
        d.x = Math.max(d.radius + 2, Math.min(mapWidth - d.radius - 2, d.x));
        d.y = Math.max(d.radius + 2, Math.min(mapHeight - d.radius - 2, d.y));
    });

    if (locations.length === 0) {
        svg.append("text")
            .attr("x", mapWidth / 2)
            .attr("y", mapHeight / 2)
            .attr("text-anchor", "middle")
            .attr("fill", "#9ca3af")
            .style("font-size", "18px")
            .text("No locations match this filter.");
        d3.select("#zoomResetBtn").property("disabled", true);
        return;
    }

    const delaunay = d3.Delaunay.from(layoutLocations, d => d.x, d => d.y);
    const voronoi = delaunay.voronoi([0, 0, mapWidth, mapHeight]);
    const features = layoutLocations.map((d, index) => ({
        ...d,
        polygon: voronoi.cellPolygon(index)
    })).filter(d => d.polygon);

    const polygonPath = polygon => `M${polygon.map(point => point.join(",")).join("L")}Z`;

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
            activeFindingId = getPrimaryFindingForLocation(d.name)?.id || null;
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

    g.selectAll(".location-marker")
        .data(layoutLocations)
        .enter()
        .append("circle")
        .attr("class", d => `circle-clickable location-marker site-${d.siteType}${d.tone ? ` tone-${d.tone}` : ""}`)
        .attr("cx", d => d.x)
        .attr("cy", d => d.y)
        .attr("r", d => d.radius)
        .style("pointer-events", "none");

    g.selectAll(".location-code")
        .data(layoutLocations)
        .enter()
        .append("text")
        .attr("class", d => `location-code site-${d.siteType}`)
        .attr("x", d => d.x)
        .attr("y", d => d.y + 3)
        .attr("text-anchor", "middle")
        .text(d => d.markerCode);

    g.selectAll(".location-label")
        .data(layoutLocations)
        .enter()
        .append("text")
        .attr("class", "location-label")
        .attr("x", d => d.x)
        .attr("y", d => d.y - d.radius - 8)
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
