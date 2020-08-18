import MpgItem from "./MpgItem";
import MpgList from "./MpgList";
import React from "react";
import * as d3 from "d3";
import MpgEntry from "./MpgEntry";

interface Refs {
  mountPoint: HTMLDivElement | null;
}

interface node {
  name: string;
  group: number;
  size: number;
}

interface link {
  source: number;
  target: number;
  value: number;
}

interface tagsData {
  nodes: node[];
  links: link[];
}

interface MpgForceComponentProps {
  items: Map<string, MpgItem>;
  viewWidth: number
  viewHeight: number
  entries: Map<string,MpgEntry>
}

interface MpgForceComponentState {
}

export default class MpgForceComponent extends React.Component<
  MpgForceComponentProps,
  MpgForceComponentState
> {
  ctrls: Refs = { mountPoint: null };
  // private readonly viewHeight = 680;
  // private readonly viewWidth = 1100;
  private itemsData: tagsData = { nodes: [], links: [] };
  private itemArray: Array<MpgItem> = [];
  private graph = MpgList.fromListData(
    "0",
    MpgList.getBlankListData("My Graph")
  );
  constructor(props: MpgForceComponentProps) {
    super(props);
    this.state = {
    };
  }

  static getDerivedStateFromProps = (
    newProps: MpgForceComponentProps,
    state: MpgForceComponentState
  ) => {
    state = {
      ...state,
      items: newProps.items,
    };
    return state;
  };

  componentDidMount = () => {
    this.renderForce();
  };

  render = () => {
    return (
      <div ref={(mountPoint) => (this.ctrls.mountPoint = mountPoint)}></div>
    );
  };

  createNodeAndLinkData = () => {
    // this.itemArray = (Array.from(this.props.lists.values()) as Array<
    //   MpgItem
    // >).concat(Array.from(this.props.entries.values()));
    this.itemsData = { nodes: [], links: [] };
    this.itemArray = Array.from(this.props.items.values());
    // const graph = MpgList.fromListData(
    //   "0",
    //   MpgList.getBlankListData("My Graph")
    // );
    this.itemArray.unshift(this.graph);
    // now create a node for each list
    this.itemArray.forEach((item, index) => {
      if (index === 0) {
        this.itemsData.nodes.push({ name: "My Graph", group: 0, size: 30 });
      } else {
        this.itemsData.nodes.push({
          name: item.headline,
          group: 1,
          // size: item.entriesWithAllTags.size,
          size: this.getNumberOfEntriesWithAllTagsOfItem(item)
        });
      }
    });
    // now create links for lists
    this.itemArray.forEach((item, index) => {
      if (index === 0) {
        // do nothing. it's the root node
      } else {
        if (item.parentRels.size === 0) {
          this.addLinkForListAndItsChildren(item, index);
        }
      }
    });
    // create links for entries
  };

  getNumberOfEntriesWithAllTagsOfItem = (item: MpgItem): number=>{
    let numberOfEntriesWithAllTags = 0
    this.props.entries.forEach(entry=>{
      if(entry.hasAllTags(item.tagRels)){
        numberOfEntriesWithAllTags += 1
      }
    })
    return numberOfEntriesWithAllTags
  }

  addLinkForListAndItsChildren = (
    list: MpgItem,
    index: number,
    parentIndex: number = 0
  ) => {
    this.itemsData.links.push({
      source: parentIndex,
      target: index,
      value: 1,
    });
    // create links for entries
    // list.entriesWithAllTags.forEach((entry) => {
    //   const entryIndex = this.getIndexOfItemInItemArray(entry.id);
    //   if (entryIndex !== -1) {
    //     this.itemsData.links.push({
    //       source: index,
    //       target: entryIndex,
    //       value: 1,
    //     });
    //   } else {
    //     throw new Error(
    //       "addLinkForListAndItsChildren: entry was not found in item array. entry:" +
    //         entry.headline
    //     );
    //   }
    // });
    // create links for children
    list.childRels.forEach((childRel) => {
      const child = childRel.child;
      const childIndex = this.getIndexOfItemInItemArray(child.id);
      if (childIndex !== -1) {
        this.addLinkForListAndItsChildren(child, childIndex, index);
      } else {
        throw new Error(
          "addNodeAndLinkForListAndItsChildren: child was not found in item array. item:" +
            child.headline
        );
      }
    });
  };

  getIndexOfItemInItemArray = (itemId: string): number => {
    return this.itemArray.findIndex((item) => {
      return item.id === itemId;
    });
  };

  renderForce = () => {
    this.createNodeAndLinkData();
    const data: any = this.itemsData;
    const width = this.props.viewWidth;
    const height = this.props.viewHeight - 50;
    const force = d3
      .forceSimulation()
      .nodes(data.nodes)
      .force("charge", d3.forceManyBody().strength(-240))
      .force("link", d3.forceLink(data.links).distance(70))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((node: any) => {
          return node.radius + 10;
        })
      );

    const svg = d3
      .select(this.ctrls.mountPoint)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .call(
        d3
          .zoom<SVGSVGElement, any>()
          .extent([
            [0, 0],
            [width, height],
          ])
          .on("zoom", () => {
            svg.attr("transform", d3.event.transform);
          })
      );

    const link = svg
      .selectAll("line")
      .data(data.links)
      .enter()
      .append("line")
      .style("stroke", "#999999")
      .style("stroke-opacity", 0.6)
      .style("stroke-width", (d: any) => Math.sqrt(d.value));

    function dragStarted(d: any) {
      !d3.event.active && force.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d: any) {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    }

    function dragEnded(d: any) {
      !d3.event.active && force.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const node = svg
      .selectAll("circle")
      .data(data.nodes)
      .enter()
      .append<Element>("circle")
      .attr("r", (node: any) => {
        return 5 + (node.size < 45 ? node.size * 0.5 : 20);
      })
      .style("stroke", "#FFFFFF")
      .style("stroke-width", 1.5)
      .style("fill", (d: any) => color(d.group))
      .call(
        d3
          .drag()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded)
      );

    const text = svg
      .selectAll("text")
      .data(data.nodes)
      .enter()
      .append<Element>("text")
      .text((d: any) => {
        return d.name;
      })
      .attr("font-size", 10)
      .style("stroke", "black")
      .call(
        d3
          .drag()
          .on("start", dragStarted)
          .on("drag", dragged)
          .on("end", dragEnded)
      );

    force.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      text.attr("x", (d: any) => d.x + 9).attr("y", (d: any) => d.y);
    });
  };
}
