const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { getProcessedData } = require('./studentsStatistics');

const { Chart, BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } = require('chart.js');
const ChartDataLabels = require('chartjs-plugin-datalabels');


Chart.register(BarController, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend, ChartDataLabels);

const CHART_WIDTH = 600;
const CHART_HEIGHT = 400;



const generateChart = async () => {
    const chartCanvas = new ChartJSNodeCanvas({ width: CHART_WIDTH, height: CHART_HEIGHT });
    const { labels, data, totalStudents } = getProcessedData();

    const legendLabels = [
        { text: "Gar nicht bestanden", fillStyle: "red" },
        { text: "Nicht bestanden", fillStyle: "orange" },
        { text: "Bestanden", fillStyle: "gray" },
        { text: "Sehr gut bestanden", fillStyle: "green" }
    ];

    const colors = labels.map(label => {
        if (label === '5.0 (g.n.b)') return 'red';
        if (label === '5.0 (n.b)') return 'orange';
        if (['4.0', '3.7', '3.3', '3.0', '2.7', '2.3', '2.0', '1.7'].includes(label)) return 'gray';
        if (['1.3', '1.0'].includes(label)) return 'green';
        return 'blue';
    });

    const config = {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Anzahl der Personen',
                data,
                backgroundColor: colors,
                borderColor: 'black',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            barPercentage: 0.7,
            scales: {
                x: {
                    title: { display: true, text: 'Noten', font: { size: 16 } },
                    grid: { display: false }
                },
                y: {
                    title: { display: true, text: 'Anzahl der Studenten', font: { size: 16 } },
                    beginAtZero: true,
                    suggestedMax: Math.max(totalStudents / 2),
                    ticks: { stepSize: 5 },
                    grid: { display: true }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        generateLabels: () => legendLabels,
                        boxWidth: 20,
                        usePointStyle: true,
                        pointStyle: 'rectRounded',
                        padding: 15,
                        font: {
                            size: 12,
                            weight: 'bold'
                        }
                    }
                },
                datalabels: {
                    anchor: 'end',       // position par rapport à la barre
                    align: 'start',      // aligne au-dessus
                    offset: -4,          // petit décalage vers le haut
                    formatter: (value) => {
                        const percentage = ((value / totalStudents) * 100).toFixed(1) + "%";
                        return percentage;
                    },
                    font: {
                        size: 12,
                        weight: 'bold'
                    },
                    color: 'black',
                    clamp: true,
                    clip: false
                }
            }
        },
        plugins: [ChartDataLabels]
    };

    return await chartCanvas.renderToBuffer(config);
};


const generatePassChart = async () => {
    const { successRate, failureRate } = getProcessedData();

    const chartCanvas = new ChartJSNodeCanvas({ width: CHART_WIDTH, height: CHART_HEIGHT });

    const config = {
        type: 'bar',
        data: {
            labels: ['Bestanden', 'Durchgefallen'],
            datasets: [
                {
                    label: 'Bestanden',
                    data: [successRate, null],
                    backgroundColor: 'green',
                    borderColor: 'black',
                    borderWidth: 1
                },
                {
                    label: 'Durchgefallen',
                    data: [null, failureRate],
                    backgroundColor: 'red',
                    borderColor: 'black',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 25,
                        usePointStyle: true,
                        pointStyle: 'rectRounded',
                        padding: 15,
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Kategorie',
                        font: { size: 16 }
                    },
                    grid: { display: false }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Prozentsatz (%)',
                        font: { size: 16 }
                    },
                    beginAtZero: true,
                    grid: { display: true }
                }
            }
        }
    };

    return await chartCanvas.renderToBuffer(config);
};





const generateRadarChart = async (labels, dataset, title) => {
    const chartCanvas = new ChartJSNodeCanvas({ width: CHART_WIDTH, height: CHART_HEIGHT });

    const config = {
        type: 'radar',
        data: {
            labels,
            datasets: [{
                label: title,
                data: dataset,
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderColor: 'rgba(54, 162, 235, 1)',
                pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                pointBorderColor: '#fff',
                pointRadius: 5,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        boxWidth: 20,
                        color: 'black',
                        font: {
                            size: 14,
                            weight: 'bold'
                        },
                        padding: 15,
                        usePointStyle: true,
                        pointStyle: 'rectRounded'
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    suggestedMax: 10,
                    angleLines: { display: true },
                    ticks: { stepSize: 2 },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        }
    };

    return await chartCanvas.renderToBuffer(config);
};

module.exports = { generateChart, generatePassChart, generateRadarChart };