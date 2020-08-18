import React from "react";
import "./index.css";
import * as d3 from "d3";
import MpgEntry from "./MpgEntry";
import MpgTheme from "./MpgTheme";

interface Refs {
  mountPoint: HTMLDivElement | null;
}

interface TimelineData {
  date: Date;
  sentiment: number;
  numberOfEntries: number;
}

interface MpgTimelineComponentProps {
  viewWidth: number;
  viewHeight: number;
  entries: Map<string, MpgEntry>;
  earlistEntryDate: number
  dateEntryMap: Map<number,Map<string,MpgEntry>>
}

interface MpgTimelineComponentState {
  entries: Map<string, MpgEntry>;
  dateEntryMap: Map<number,Map<string,MpgEntry>>
}

export default class MpgTimelineComponent extends React.Component<
  MpgTimelineComponentProps,
  MpgTimelineComponentState
> {
  ctrls: Refs = { mountPoint: null };
  // private entriesDate: Map<number, Map<string, MpgEntry>> = new Map();
  private timelineData: TimelineData[] = [];
  // private overallAverageSentiment = 0;
  constructor(props: MpgTimelineComponentProps) {
    super(props);
    this.state = {
      entries: props.entries,
      dateEntryMap: props.dateEntryMap,
    };
  }

  componentDidMount = () => {
    this.renderTimeline();
  };

  render = () => {
    return (
      <div ref={(mountPoint) => (this.ctrls.mountPoint = mountPoint)}></div>
    );
  };

  getLast7Days = (): Map<string, MpgEntry> => {
    // fisrt sort by updatedAt
    // find today
    // find 7 days prior
    // include only these entry
    // const last7DaysEntries = new Map<string, MpgEntry>();
    // const today = new Date();
    // const lastWeek = new Date(
    //   today.getFullYear(),
    //   today.getMonth(),
    //   today.getDate() - 30
    // );
    // this.state.entries.forEach((entry) => {
    //   if (entry.updatedAt.getTime() >= lastWeek.getTime()) {
    //     last7DaysEntries.set(entry.id, entry);
    //   }
    // });
    // return last7DaysEntries;
    return this.state.entries
  };

  createTimelineData = () => {
    // this.entriesDate = new Map();
    // const entriesToDisplay = this.getLast7Days()
    // // const entryArray = Array.from(this.state.entries.values());
    //  const entryArray = Array.from(entriesToDisplay.values());
    // // use createdAt
    // // const sortedEntries = entryArray.sort((item1, item2) => {
    // //   return item2.updatedAt.getTime() - item1.updatedAt.getTime();
    // // });
    // const sortedEntries = entryArray.sort((item1, item2) => {
    //   return item2.createdAt.getTime() - item1.createdAt.getTime();
    // });
    // const earlistEntryDate = sortedEntries[
    //   sortedEntries.length - 1
    // ].createdAt.setHours(0, 0, 0, 0);
    // const dayInMilliseconds = 1000 * 60 * 60 * 24;
    // sortedEntries.forEach((entry) => {
    //   // add element for createdAt and updatedAt
    //   // this should be a fuction fo createdAt and UpdatedAt
    //   // createdAt
    //   let numberOfDaysSinceStart = Math.floor(
    //     (entry.createdAt.getTime() - earlistEntryDate) / dayInMilliseconds
    //   );
    //   let entries = this.entriesDate.get(numberOfDaysSinceStart);
    //   if (entries !== undefined) {
    //     entries.set(entry.id, entry);
    //   } else {
    //     entries = new Map<string, MpgEntry>();
    //     entries.set(entry.id, entry);
    //     this.entriesDate.set(numberOfDaysSinceStart, entries);
    //   }
    //   numberOfDaysSinceStart = Math.floor(
    //     (entry.updatedAt.getTime() - earlistEntryDate) / dayInMilliseconds
    //   );
    //   // updateAt
    //   entries = this.entriesDate.get(numberOfDaysSinceStart);
    //   if (entries !== undefined) {
    //     entries.set(entry.id, entry);
    //   } else {
    //     entries = new Map<string, MpgEntry>();
    //     entries.set(entry.id, entry);
    //     this.entriesDate.set(numberOfDaysSinceStart, entries);
    //   }
    // });
    // get date of last week
    // setHours(this.parkedUntil.getHours() + numberOfHours);
    // const lastWeekDate = (new Date()).setHours(new Date().getHours() - (7 * 24))
    // const today = new Date();
    // const lastWeekDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
    const timelineData: TimelineData[] = [];
    // now create a panel for each entry
    this.state.dateEntryMap.forEach((dateEntry, index) => {
      const entriesArray = Array.from(dateEntry.values());
      const averageSentiment = this.calculateAverageSentiment(dateEntry);
      // const date = entriesArray[0].updatedAt;
      const numberOfzEntries = entriesArray.length;
      // const dataPoint = { date: date, value: averageSentiment };
      const date = this.calculateDateFromIndex(index)
      const dataPoint = {
        date: date,
        numberOfEntries: numberOfzEntries,
        sentiment: averageSentiment,
      };
      // if(date > lastWeekDate){
      // }
      timelineData.push(dataPoint);
      // const panel: PanelInterface = {
      //   index: key,
      //   renderLabelFun: this.renderTimelinePanelLabel,
      //   renderDetailsFun: this.renderTimelinePanel,
      //   initialStateOpen: false,
      //   leftSideFunction: this.handleRemoveFromList,
      //   leftSideFunctionEnabled: false,
      //   leftSideFunctionIcon: "",
      //   leftSideFunctionToolTip: "",
      // };
      // this.panelList.push(panel);
    });
    // console.log(
    //   "item 0 mill..",
    //   timelineData[0].date.getMilliseconds(),
    //   "item 1 milli...",
    //   timelineData[1].date.getMilliseconds()
    // );
    // sort the date
    this.timelineData = timelineData.sort((item1, item2) => {
      return item1.date.getTime() - item2.date.getTime();
    });
    // this.timelineData = timelineData.sort((item1, item2) => {
    //   return item1.date - item2.date;
    // });
    // console.log(
    //   "unsorted:",
    //   timelineData,
    //   " supposedly sorted: ",
    //   this.timelineData
    // );
  };

  private calculateDateFromIndex = (index: number): Date=>{
    const dayInMilliseconds = 1000 * 60 * 60 * 24;
    return new Date(this.props.earlistEntryDate + index  * dayInMilliseconds)
  }

  calculateOverallSentiment = (): number => {
    let sumOfSentiments = 0;
    let aggregateSentiment = 0;
    const entriesSize = this.props.entries.size;
    if (entriesSize > 0) {
      this.props.entries.forEach((entry) => {
        sumOfSentiments += entry.netSentiment;
      });
      aggregateSentiment = sumOfSentiments / entriesSize;
    }
    return aggregateSentiment;
  };

  calculateAverageSentiment = (entries: Map<string, MpgEntry>): number => {
    let averageSentiment = 0;
    if (entries.size !== 0) {
      let sumOfSentiment = 0;
      entries.forEach((entry) => {
        sumOfSentiment += entry.netSentiment;
      });
      averageSentiment = sumOfSentiment / entries.size;
    }
    return averageSentiment;
  };

  renderTimeline = () => {
    this.createTimelineData();
    const overallAverageSentiment = this.calculateOverallSentiment();
    // console.log("Timeline data:", this.timelineData);

    // set the dimensions and margins of the graph
    // const margin = { top: 20, right: 50, bottom: 50, left: 50 };
    const margin = {
      top: 0.05 * this.props.viewHeight,
      right: 0.1 * this.props.viewWidth,
      bottom: 0.1 * this.props.viewHeight,
      left: 0.1 * this.props.viewWidth,
    };
    const width = this.props.viewWidth - margin.left - margin.right;
    const height = this.props.viewHeight - margin.top - margin.bottom;

    // parse the date / time
    // var parseTime = d3.timeParse("%d-%B-%y");
    // var parseTime = d3.timeParse("%B %d");

    // set the ranges
    var x = d3.scaleTime().range([0, width]);
    var y0 = d3.scaleLinear().range([height, 0]);
    // var y1 = d3.scaleLinear().range([height, 0]);

    // define the sentiment line
    var sentimentLine = d3
      .line<TimelineData>()
      // .curve(d3.curveCardinal)
      .x(function (d: any) {
        return x(d.date);
      })
      .y(function (d: any) {
        return y0(d.sentiment);
      });

    // define the sentiment line
    var sentimentSmoothed = d3
      .line<TimelineData>()
      .curve(d3.curveBasis)
      .x(function (d: any) {
        return x(d.date);
      })
      .y(function (d: any) {
        return y0(d.sentiment);
      });

    const averageSentimentLine = d3
      .line<TimelineData>()
      .x(function (d: any) {
        return x(d.date);
      })
      .y(function (d: any) {
        return y0(overallAverageSentiment);
      });

    const zeroSentimentLine = d3
      .line<TimelineData>()
      .x(function (d: any) {
        return x(d.date);
      })
      .y(function (d: any) {
        return y0(0);
      });

    // var valueline1 = d3
    //   .line<TimelineData>()
    //   .x(function (d: any) {
    //     return x(d.date);
    //   })
    //   .y(function (d: any) {
    //     return y1(d.numberOfEntries);
    //   });

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3
      .select(this.ctrls.mountPoint)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Scale the range of the data
    // x.domain(d3.extent(data, function(d:any) { return d.date; }));
    // x.domain([startDate!, endDate!]);
    // x.domain([new Date(this.timelineData[0].date), new Date(data[data.length -1].date)]);?
    x.domain([
      this.timelineData[0].date,
      this.timelineData[this.timelineData.length - 1].date,
    ]);
    // y.domain([
    //   0,
    //   d3.max(data, function (d: any) {
    //     return d.value;
    //   }),
    // ]);
    // y.domain([-1.8, 1.8]);
    let lowestSentiment = 0;
    let highestSentiment = 0;
    let heighestNumberOfEntries = 0;
    this.timelineData.forEach((data) => {
      lowestSentiment =
        lowestSentiment > data.sentiment - 0.2
          ? data.sentiment - 0.2
          : lowestSentiment;
      highestSentiment =
        highestSentiment < data.sentiment ? data.sentiment : highestSentiment;
      heighestNumberOfEntries =
        heighestNumberOfEntries < data.numberOfEntries
          ? data.numberOfEntries
          : heighestNumberOfEntries;
    });
    y0.domain([lowestSentiment, highestSentiment]);
    // y1.domain([0, heighestNumberOfEntries]);

    // Add the valueline path.
    svg
      .append("path")
      .data([this.timelineData])
      // .attr("class", "line0")
      .attr("fill", "none")
      .attr("stroke", MpgTheme.palette.primary.light)
      .attr("stroke-width", 2)
      .attr("d", sentimentLine);

    // Add the smoothed
    svg
      .append("path")
      .data([this.timelineData])
      // .attr("class", "line0")
      .attr("fill", "none")
      .attr("stroke", MpgTheme.palette.primary.dark)
      .attr("stroke-width", 3)
      .attr("d", sentimentSmoothed);

    // Add the averge
    svg
      .append("path")
      .data([this.timelineData])
      .attr("fill", "none")
      .attr("stroke", MpgTheme.palette.secondary.light)
      .attr("stroke-width", 2)
      .style("stroke-dasharray", "4, 4")
      .attr("d", averageSentimentLine);

    // Add the zero line
    svg
      .append("path")
      .data([this.timelineData])
      .attr("fill", "none")
      .attr("stroke", MpgTheme.palette.primary.dark)
      .attr("stroke-width", 1)
      .attr("d", zeroSentimentLine);

    // Add the valueline path.
    // svg
    //   .append("path")
    //   .data([this.timelineData])
    //   .attr("class", "line1")
    //   .attr("d", valueline1);

    // Add the X Axis
    svg
      .append("g")
      .attr("transform", "translate(0," + height + ")")
      .call(d3.axisBottom(x))
      .style("color", MpgTheme.palette.primary.dark)
      // .selectAll("text")
      // .attr("y", 0)
      // .attr("x", -10)
      // // .attr("dy", ".35em")
      //  // .attr("dy", "100px")
      // .attr("transform", "rotate(270)")
      // .style("text-anchor", "end");

    // Add the Y Axis
    svg
      .append("g")
      .call(d3.axisLeft(y0))
      .style("color", MpgTheme.palette.primary.dark);

    // Define the div for the tooltip
    var div = d3
      .select(this.ctrls.mountPoint)
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // 12. Appends a circle for each datapoint
    svg
      .selectAll("circle")
      .data(this.timelineData)
      .enter()
      .append("circle") // Uses the enter().append() method
      // .attr("class", "dot") // Assign a class for styling
      .attr("cx", function (d, i) {
        return x(d.date);
      })
      .attr("cy", function (d: any) {
        return y0(d.sentiment);
      })
      // .attr("r", 3)
      .attr("r", function (d) {
        let reduis = 2
        if(d.numberOfEntries > 2){
          reduis = d.numberOfEntries * 0.3
        }
        if(reduis > 4){
          reduis = 4
        }
        return reduis
      })
      .style("fill", MpgTheme.palette.secondary.light)
      .style("stroke", MpgTheme.palette.primary.contrastText)
      .attr("stroke-width", 1)
      .on("mouseover", function (d) {
        div.transition().duration(200).style("opacity", 0.9);
        div
          .html(
            d.date.toString().substring(0, 10) +
              "<br/>" +
              "Sentiment: " +
              d.sentiment.toFixed(2) +
              "<br/>" +
              "Entries: " +
              d.numberOfEntries
          )
          .style("background", "white")
          .style("color", MpgTheme.palette.primary.dark)
          .style("left", d3.event.pageX + 18 + "px")
          .style("top", d3.event.pageY - 28 + "px")
          .style("font-weight", "bold");
      })
      .on("mouseout", function (d) {
        div.transition().duration(500).style("opacity", 0);
      });

    // Add the Y Axis
    // svg
    //   .append("g")
    //   .call(d3.axisRight(y1))
    //   .attr("transform", "translate(" + width + " ,0)")
    //   .style("color", "red");

    // get the x and y values for least squares
    // var xSeries = d3.range(1, this.timelineData.length + 1);
    // var ySeries = this.timelineData.map(function(d: TimelineData) { return d.sentiment });

    // var leastSquaresCoeff = leastSquares(xSeries, ySeries);

    // // apply the reults of the least squares regression
    // var x1 = xLabels[0];
    // var y1 = leastSquaresCoeff[0] + leastSquaresCoeff[1];
    // var x2 = xLabels[xLabels.length - 1];
    // var y2 = leastSquaresCoeff[0] * xSeries.length + leastSquaresCoeff[1];
    // var trendData = [[x1,y1,x2,y2]];

    // var trendline = svg.selectAll(".trendline")
    // 	.data(trendData);

    // trendline.enter()
    // 	.append("line")
    // 	.attr("class", "trendline")
    // 	.attr("x1", function(d) { return xScale(d[0]); })
    // 	.attr("y1", function(d) { return yScale(d[1]); })
    // 	.attr("x2", function(d) { return xScale(d[2]); })
    // 	.attr("y2", function(d) { return yScale(d[3]); })
    // 	.attr("stroke", "black")
    // 	.attr("stroke-width", 1);
  };

  leastSquare = () => {};
}
