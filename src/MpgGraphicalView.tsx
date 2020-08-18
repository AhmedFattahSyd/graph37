import React from "react";
import { Card, Button, Select, MenuItem } from "@material-ui/core";
import MpgTheme from "./MpgTheme";
import MpgTag from "./MpgTag";
import MpgItem from "./MpgItem";
import MpgList from "./MpgList";
import MpgViewableItem from "./MpgViewableItem";
import MpgTreeComponent from "./MpgTreeComponent";
import MpgForceComponent from "./MpgForceComponent";
import MpgTimelineComponent from "./MpgTimelineComponent";
import MpgEntry from "./MpgEntry";

interface MpgGraphicalViewProps {
  tags: Map<string, MpgTag>;
  entries: Map<string, MpgEntry>;
  lists: Map<string, MpgList>;
  closeView: Function;
  currentItem: MpgViewableItem;
  earlistEntryDate: number
  dateEntryMap: Map<number,Map<string,MpgEntry>>
}

interface MpgGraphicalViewState {
  tags: Map<string, MpgTag>;
  entries: Map<string, MpgEntry>;
  lists: Map<string, MpgList>;
  renderGraphComponent: boolean;
  itemsToDisplay: ItemsToDisplay;
  items: Map<string, MpgItem>;
  graphType: MpgGraphType;
}

enum ItemsToDisplay {
  Tags = "Tags",
  Lists = "Lists",
}

enum MpgGraphType {
  Timeline = "Timeline",
  ListForce = "ListForce",
  ListTree = "ListTree",
  TagForce = "TagForce",
  TagTree = "TagTree",
}

export default class MpgGraphicalView extends React.Component<
  MpgGraphicalViewProps,
  MpgGraphicalViewState
> {
  // ctrls: Refs = { mountPoint: null };
  private readonly viewHeight = 680;
  private readonly viewWidth = 900;
  // private itemsData: tagsData = { nodes: [], links: [] };
  // private itemArray: Array<MpgItem> = [];
  constructor(props: MpgGraphicalViewProps) {
    super(props);
    this.state = {
      entries: props.entries,
      tags: props.tags,
      lists: props.lists,
      renderGraphComponent: true,
      itemsToDisplay: ItemsToDisplay.Lists,
      items: props.lists,
      graphType: MpgGraphType.Timeline,
    };
  }

  static getDerivedStateFromProps = async (
    newProps: MpgGraphicalViewProps,
    state: MpgGraphicalViewState
  ) => {
    state = {
      ...state,
      entries: newProps.entries,
      tags: newProps.tags,
      lists: newProps.lists,
    };
    return state;
  };

  render = () => {
    return (
      <div>
        <Card
          elevation={1}
          style={{
            width: this.viewWidth,
            height: this.viewHeight,
            margin: 5,
            backgroundColor: MpgTheme.palette.primary.dark,
          }}
        >
          {this.renderHeader()}
          <div
            style={{
              margin: 5,
              // height: this.viewHeight - 50,
              backgroundColor: MpgTheme.palette.primary.contrastText,
            }}
          >
            {this.state.renderGraphComponent ? this.renderGraph() : <div></div>}
          </div>
          <Button
            onClick={() => this.handleRefresh()}
            style={{
              margin: 5,
              color: MpgTheme.palette.primary.contrastText,
              backgroundColor: MpgTheme.palette.primary.main,
            }}
            size="small"
          >
            Refresh
          </Button>
          <Button
            onClick={() => this.handleClose()}
            style={{
              margin: 5,
              color: MpgTheme.palette.primary.contrastText,
              backgroundColor: MpgTheme.palette.primary.main,
            }}
            size="small"
          >
            Close
          </Button>
        </Card>
      </div>
    );
  };

  // renderGraph = () => {
  //   return (
  //     <div>
  //       <MpgTimelineComponent
  //         viewWidth={this.viewWidth}
  //         viewHeight={this.viewHeight - 100}
  //         entries = {this.state.entries}
  //       />
  //       {/* {this.state.graphType === GraphType.Force
  //         ? this.renderForceGraph()
  //         : this.renderTreeGraph()} */}
  //     </div>
  //   );
  // };

  renderGraph = () => {
    switch (this.state.graphType) {
      case MpgGraphType.Timeline:
        return this.renderTimeline();
      case MpgGraphType.ListForce:
      case MpgGraphType.TagForce:
        return this.renderForceGraph();
      case MpgGraphType.ListTree:
      case MpgGraphType.TagTree:
        return this.renderTreeGraph();
      default:
        return <div></div>;
    }
  };

  renderTimeline = () => {
    return (
      <div>
        <MpgTimelineComponent
          viewWidth={this.viewWidth}
          viewHeight={this.viewHeight - 100}
          entries={this.state.entries}
          earlistEntryDate={this.props.earlistEntryDate}
          dateEntryMap={this.props.dateEntryMap}
        />
      </div>
    );
  };

  renderTreeGraph = () => {
    return (
      <div>
        <MpgTreeComponent
          items={this.state.items}
          viewWidth={this.viewWidth}
          viewHeight={this.viewHeight - 100}
        />
      </div>
    );
  };

  renderForceGraph = () => {
    return (
      <div>
        <MpgForceComponent
          items={this.state.items}
          viewWidth={this.viewWidth}
          viewHeight={this.viewHeight - 50}
          entries={this.props.entries}
        />
      </div>
    );
  };

  renderHeader = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-around",
          alignContent: "center",
          alignItems: "center",
          margin: 5,
          backgroundColor: MpgTheme.palette.primary.dark,
        }}
      >
        {/* {this.renderLeftIcon()} */}
        {/* <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            color: MpgTheme.palette.primary.contrastText,
          }}
        >
          Graphical View
        </Typography> */}
        {/* {this.renderRightIcon()} */}
        <Select
          labelId="privacyInputLabel"
          id="privacySelect"
          value={this.state.graphType}
          onChange={this.handleGraphTypeChange}
          style={{
            color: MpgTheme.palette.primary.contrastText,
            fontWeight: "bold",
            fontSize: "16px",
          }}
        >
          <MenuItem value={MpgGraphType.Timeline}>Timeline</MenuItem>
          <MenuItem value={MpgGraphType.ListForce}>List Force</MenuItem>
          <MenuItem value={MpgGraphType.ListTree}>List Tree</MenuItem>
          <MenuItem value={MpgGraphType.TagForce}>Tag Force</MenuItem>
          <MenuItem value={MpgGraphType.TagTree}>Tag Tree</MenuItem>
        </Select>
      </div>
    );
  };

  handleGraphTypeChange = async (event: React.ChangeEvent<{ value: any }>) => {
    const selectedGraphType: MpgGraphType = event.target.value;
    if (
      selectedGraphType === MpgGraphType.ListForce ||
      selectedGraphType === MpgGraphType.ListTree
    ) {
      this.setState({
        itemsToDisplay: ItemsToDisplay.Lists,
        items: this.state.lists,
      });
    }
    if (
      selectedGraphType === MpgGraphType.TagForce ||
      selectedGraphType === MpgGraphType.TagTree
    ) {
      this.setState({
        itemsToDisplay: ItemsToDisplay.Tags,
        items: this.state.tags,
      });
    }
    await this.setState({ graphType: selectedGraphType });
  };

  // handleSelectLists = () => {
  //   this.setState({
  //     itemsToDisplay: ItemsToDisplay.Lists,
  //     items: this.state.lists,
  //   });
  //   this.handleRefresh();
  // };

  // handleSelectForce = () => {
  //   this.setState({ graphType: GraphType.Force });
  // };

  // handleSelectTree = () => {
  //   this.setState({ graphType: GraphType.Tree });
  // };

  // handleSelectTags = () => {
  //   this.setState({
  //     itemsToDisplay: ItemsToDisplay.Tags,
  //     items: this.state.tags,
  //   });
  //   this.handleRefresh();
  // };

  // renderLeftIcon = () => {
  //   return (
  //     <div style={{ display: "flex", alignItems: "center" }}>
  //       <Typography
  //         variant="body1"
  //         style={{
  //           color: MpgTheme.palette.primary.contrastText,
  //         }}
  //       >
  //         Tags
  //       </Typography>
  //       <Radio
  //         checked={this.state.itemsToDisplay === ItemsToDisplay.Tags}
  //         onChange={this.handleSelectTags}
  //         value="a"
  //         name="radio-button-demo"
  //         inputProps={{ "aria-label": "A" }}
  //       />

  //       <Typography
  //         variant="body1"
  //         style={{
  //           color: MpgTheme.palette.primary.contrastText,
  //         }}
  //       >
  //         Lists
  //       </Typography>
  //       <Radio
  //         checked={this.state.itemsToDisplay === ItemsToDisplay.Lists}
  //         onChange={this.handleSelectLists}
  //         value="a"
  //         name="radio-button-demo"
  //         inputProps={{ "aria-label": "A" }}
  //       />
  //     </div>
  //   );
  // };

  // renderRightIcon = () => {
  //   return (
  //     <div style={{ display: "flex", alignItems: "center" }}>
  //       <Typography
  //         variant="body1"
  //         style={{
  //           color: MpgTheme.palette.primary.contrastText,
  //         }}
  //       >
  //         Tree
  //       </Typography>
  //       <Radio
  //         checked={this.state.graphType === GraphType.Tree}
  //         onChange={this.handleSelectTree}
  //         value="a"
  //         name="radio-button-demo"
  //         inputProps={{ "aria-label": "A" }}
  //       />

  //       <Typography
  //         variant="body1"
  //         style={{
  //           color: MpgTheme.palette.primary.contrastText,
  //         }}
  //       >
  //         Force
  //       </Typography>
  //       <Radio
  //         checked={this.state.graphType === GraphType.Force}
  //         onChange={this.handleSelectForce}
  //         value="a"
  //         name="radio-button-demo"
  //         inputProps={{ "aria-label": "A" }}
  //       />
  //     </div>
  //   );
  // };

  renderMenuBar = () => {
    return (
      <div>
        <Button
          onClick={() => this.handleRefresh()}
          style={{
            margin: 5,
            color: MpgTheme.palette.primary.contrastText,
            backgroundColor: MpgTheme.palette.primary.main,
          }}
          size="small"
        >
          Refresh
        </Button>
      </div>
    );
  };

  handleRefresh = async () => {
    await this.setState({ renderGraphComponent: false });
    this.setState({ renderGraphComponent: true });
  };

  handleClose = () => {
    this.props.closeView(this.props.currentItem);
  };

  // componentDidMount = () => {
  //   this.renderForce2();
  // };

  // createNodeAndLinkData = () => {
  //   // this.itemArray = (Array.from(this.props.lists.values()) as Array<
  //   //   MpgItem
  //   // >).concat(Array.from(this.props.entries.values()));
  //   this.itemArray = Array.from(this.props.lists.values());
  //   const graph = MpgList.fromListData(
  //     "0",
  //     MpgList.getBlankListData("My Graph")
  //   );
  //   this.itemArray.unshift(graph);
  //   // now create a node for each list
  //   this.itemArray.forEach((item, index) => {
  //     if (index === 0) {
  //       this.itemsData.nodes.push({ name: "My Graph", group: 0, size: 30 });
  //     } else {
  //       if (item.type === MpgItemType.List) {
  //         this.itemsData.nodes.push({
  //           name: item.headline,
  //           group: 1,
  //           size: item.entriesWithAllTags.size,
  //         });
  //       } else {
  //         //   if (item.type === MpgItemType.Entry) {
  //         //     this.itemsData.nodes.push({
  //         //       name: " ",
  //         //       group: 2,
  //         //       size: 1,
  //         //     });
  //         //   }
  //       }
  //     }
  //   });
  //   // now create links for lists
  //   this.itemArray.forEach((item, index) => {
  //     if (index === 0) {
  //       // do nothing. it's the root node
  //     } else {
  //       if (item.type === MpgItemType.List && item.parentRels.size === 0) {
  //         this.addLinkForListAndItsChildren(item, index);
  //       }
  //     }
  //   });
  //   // create links for entries
  // };

  // addLinkForListAndItsChildren = (
  //   list: MpgItem,
  //   index: number,
  //   parentIndex: number = 0
  // ) => {
  //   this.itemsData.links.push({
  //     source: parentIndex,
  //     target: index,
  //     value: 1,
  //   });
  //   // create links for entries
  //   // list.entriesWithAllTags.forEach((entry) => {
  //   //   const entryIndex = this.getIndexOfItemInItemArray(entry.id);
  //   //   if (entryIndex !== -1) {
  //   //     this.itemsData.links.push({
  //   //       source: index,
  //   //       target: entryIndex,
  //   //       value: 1,
  //   //     });
  //   //   } else {
  //   //     throw new Error(
  //   //       "addLinkForListAndItsChildren: entry was not found in item array. entry:" +
  //   //         entry.headline
  //   //     );
  //   //   }
  //   // });
  //   // create links for children
  //   list.childRels.forEach((childRel) => {
  //     const child = childRel.child;
  //     const childIndex = this.getIndexOfItemInItemArray(child.id);
  //     if (childIndex !== -1) {
  //       this.addLinkForListAndItsChildren(child, childIndex, index);
  //     } else {
  //       throw new Error(
  //         "addNodeAndLinkForListAndItsChildren: child was not found in item array. item:" +
  //           child.headline
  //       );
  //     }
  //   });
  // };

  // getIndexOfItemInItemArray = (itemId: string): number => {
  //   return this.itemArray.findIndex((item) => {
  //     return item.id === itemId;
  //   });
  // };

  // renderForce2 = () => {
  //   this.createNodeAndLinkData();
  //   const data: any = this.itemsData;
  //   const width = this.viewWidth;
  //   const height = this.viewHeight - 50;
  //   const force = d3
  //     .forceSimulation()
  //     .nodes(data.nodes)
  //     .force("charge", d3.forceManyBody().strength(-240))
  //     .force("link", d3.forceLink(data.links).distance(70))
  //     .force("center", d3.forceCenter(width / 2, height / 2))
  //     .force(
  //       "collision",
  //       d3.forceCollide().radius((node: any) => {
  //         return node.radius + 10;
  //       })
  //     );

  //   const svg = d3
  //     .select(this.ctrls.mountPoint)
  //     .append("svg")
  //     .attr("width", width)
  //     .attr("height", height)
  //     .call(
  //       d3
  //         .zoom<SVGSVGElement, any>()
  //         .extent([
  //           [0, 0],
  //           [width, height],
  //         ])
  //         .on("zoom", () => {
  //           svg.attr("transform", d3.event.transform);
  //         })
  //     );

  //   const link = svg
  //     .selectAll("line")
  //     .data(data.links)
  //     .enter()
  //     .append("line")
  //     .style("stroke", "#999999")
  //     .style("stroke-opacity", 0.6)
  //     .style("stroke-width", (d: any) => Math.sqrt(d.value));

  //   function dragStarted(d: any) {
  //     !d3.event.active && force.alphaTarget(0.3).restart();
  //     d.fx = d.x;
  //     d.fy = d.y;
  //   }

  //   function dragged(d: any) {
  //     d.fx = d3.event.x;
  //     d.fy = d3.event.y;
  //   }

  //   function dragEnded(d: any) {
  //     !d3.event.active && force.alphaTarget(0);
  //     d.fx = null;
  //     d.fy = null;
  //   }

  //   const color = d3.scaleOrdinal(d3.schemeCategory10);

  //   const node = svg
  //     .selectAll("circle")
  //     .data(data.nodes)
  //     .enter()
  //     .append<Element>("circle")
  //     .attr("r", (node: any) => {
  //       return 5 + (node.size < 45 ? node.size * 0.5 : 20);
  //     })
  //     .style("stroke", "#FFFFFF")
  //     .style("stroke-width", 1.5)
  //     .style("fill", (d: any) => color(d.group))
  //     .call(
  //       d3
  //         .drag()
  //         .on("start", dragStarted)
  //         .on("drag", dragged)
  //         .on("end", dragEnded)
  //     );

  //   const text = svg
  //     .selectAll("text")
  //     .data(data.nodes)
  //     .enter()
  //     .append<Element>("text")
  //     .text((d: any) => {
  //       return d.name;
  //     })
  //     .attr("font-size", 10)
  //     .style("stroke", "black")
  //     .call(
  //       d3
  //         .drag()
  //         .on("start", dragStarted)
  //         .on("drag", dragged)
  //         .on("end", dragEnded)
  //     );

  //   force.on("tick", () => {
  //     link
  //       .attr("x1", (d: any) => d.source.x)
  //       .attr("y1", (d: any) => d.source.y)
  //       .attr("x2", (d: any) => d.target.x)
  //       .attr("y2", (d: any) => d.target.y);

  //     node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
  //     text.attr("x", (d: any) => d.x + 9).attr("y", (d: any) => d.y);
  //   });
  // };
}
