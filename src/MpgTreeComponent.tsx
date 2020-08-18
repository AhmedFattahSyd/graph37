import MpgTag from "./MpgTag";
import MpgItem from "./MpgItem";
import React from "react";
import * as d3 from "d3";
import './index.css';

interface Refs {
  mountPoint: HTMLDivElement | null;
}

interface MpgTreeNode {
  name: string;
  children: MpgTreeNode[];
}

interface MpgTreeComponentProps {
 items: Map<string,MpgItem>
 viewWidth: number
 viewHeight: number
}

interface MpgTreeComponentState {
  items: Map<string,MpgItem>
}

export default class MpgTreeComponent extends React.Component<
  MpgTreeComponentProps,
  MpgTreeComponentState
> {
  ctrls: Refs = { mountPoint: null };
  private tagTreeRoot: MpgTreeNode = { name: "My Graph", children: [] };
  constructor(props: MpgTreeComponentProps) {
    super(props);
    this.state = {
     items: props.items
    };
  }

  componentDidMount = () => {
    this.renderTree();
  };

  render = () => {
    return (
      <div ref={(mountPoint) => (this.ctrls.mountPoint = mountPoint)}></div>
    );
  };

  createTreeData = () => {
    this.props.items.forEach((tag) => {
      if (tag.parentRels.size === 0) {
        this.insertTagAndChildren(tag, this.tagTreeRoot);
      }
    });
  };

  insertTagAndChildren = (tag: MpgItem, parentNode: MpgTreeNode) => {
    const tagTreeNode = { name: tag.headline, children: [] };
    parentNode.children.push(tagTreeNode);
    tag.childRels.forEach((childRel) => {
      this.insertTagAndChildren(childRel.item2 as MpgTag, tagTreeNode);
    });
  };

  renderTree4 = () => {
    this.createTreeData();
    const width = this.props.viewWidth;

    // define data object{name: string, children: object}
    // var data = {
    //   name: "Top Level",
    //   children: [
    //     {
    //       name: "Level 2: A",
    //       children: [{ name: "Son of A" }, { name: "Daughter of A" }],
    //     },
    //     { name: "Level 2: B" },
    //   ],
    // };
    const data = this.tagTreeRoot;

    function tree(data: any) {
      const root: any = d3.hierarchy(data);
      root.dx = 10;
      root.dy = width / (root.height + 1);
      return d3.tree().nodeSize([root.dx, root.dy])(root);
    }

    const root: any = tree(data);

    let x0 = Infinity;
    let x1 = -x0;
    root.each((d: any) => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });

    var svg = d3
      .select(this.ctrls.mountPoint)
      .append("svg")
      .attr("viewBox", "0, 0," + width + "," + (x1 - x0 + root.dx * 2));

    const g = svg
      .append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("transform", `translate(${root.dy / 3},${root.dx - x0})`);

    // const link = g
    // .append("g")
    // .attr("fill", "none")
    // .attr("stroke", "#555")
    // .attr("stroke-opacity", 0.4)
    // .attr("stroke-width", 1.5)
    // .selectAll("path")
    // .data(root.links())
    // .join("path")
    // .attr(
    //   "d",
    //   d3
    //   .linkHorizontal()
    //   .x((d:any) => d.y)
    //   .y((d:any) => d.x))

    g.append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(root.links())
      .join("line")
      .style("stroke", "#999999")
      .style("stroke-opacity", 0.6)
      .style("stroke-width", 1)
      .attr("x1", function (d: any) {
        return d.source.y;
      })
      .attr("y1", function (d: any) {
        return d.source.x;
      })
      .attr("x2", function (d: any) {
        return d.target.y;
      })
      .attr("y2", function (d: any) {
        return d.target.x;
      });

    const node = g
      .append("g")
      .attr("stroke-linejoin", "round")
      .attr("stroke-width", 3)
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    node
      .append("circle")
      .attr("fill", (d: any) => (d.children ? "#555" : "#999"))
      .attr("r", 2.5);

    node
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", (d: any) => (d.children ? -6 : 6))
      .attr("text-anchor", (d: any) => (d.children ? "end" : "start"))
      .text((d: any) => d.data.name)
      .clone(true)
      .lower()
      .attr("stroke", "white");
  };

  renderTree2 = () => {
    var treeData = {
      name: "Top Level",
      children: [
        {
          name: "Level 2: A",
          children: [{ name: "Son of A" }, { name: "Daughter of A" }],
        },
        { name: "Level 2: B" },
      ],
    };

    // set the dimensions and margins of the diagram
    var margin = { top: 40, right: 90, bottom: 50, left: 90 },
      width = 660 - margin.left - margin.right,
      height = 500 - margin.top - margin.bottom;

    // declares a tree layout and assigns the size
    var treemap = d3.tree().size([width, height]);

    //  assigns the data to a hierarchy using parent-child relationships
    var nodes: any = d3.hierarchy(treeData);

    // maps the node data to the tree layout
    nodes = treemap(nodes);

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3
      .select(this.ctrls.mountPoint)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom);

    var g = svg
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // adds the links between the nodes
    g.selectAll(".link")
      .data(nodes.descendants().slice(1))
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("d", function (d: any) {
        return (
          "M" +
          d.x +
          "," +
          d.y +
          "C" +
          d.x +
          "," +
          (d.y + d.parent.y) / 2 +
          " " +
          d.parent.x +
          "," +
          (d.y + d.parent.y) / 2 +
          " " +
          d.parent.x +
          "," +
          d.parent.y
        );
      });

    // adds each node as a group
    var node = g
      .selectAll(".node")
      .data(nodes.descendants())
      .enter()
      .append("g")
      .attr("class", function (d: any) {
        return "node" + (d.children ? " node--internal" : " node--leaf");
      })
      .attr("transform", function (d: any) {
        return "translate(" + d.x + "," + d.y + ")";
      });

    // adds the circle to the node
    node.append("circle").attr("r", 10);

    // adds the text to the node
    node
      .append("text")
      .attr("dy", ".35em")
      .attr("y", function (d: any) {
        return d.children ? -20 : 20;
      })
      .style("text-anchor", "middle")
      .text(function (d: any) {
        return d.data.name;
      });
  };

  renderTree = () => {
    this.createTreeData();
    const treeData = this.tagTreeRoot;

    // Set the dimensions and margins of the diagram
    var margin = { top: 20, right: 90, bottom: 30, left: 90 },
      width = this.props.viewWidth - margin.left - margin.right,
      height = this.props.viewHeight - margin.top - margin.bottom;

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3
      //   .select("body")
      .select(this.ctrls.mountPoint)
      .append("svg")
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
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
      )
      .attr("font-family", "sans-serif")
      .attr("font-size", 12)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    var i = 0,
      duration = 750,
      root: any;

    // declares a tree layout and assigns the size
    var treemap = d3.tree().size([height, width]);

    // Assigns parent, children, height, depth
    root = d3.hierarchy(treeData, function (d: any) {
      return d.children;
    });
    root.x0 = height / 2;
    root.y0 = 0;

    // Collapse after the second level
    root.children.forEach(collapse);

    update(root);

    // Collapse the node and all it's children
    function collapse(d: any) {
      if (d.children) {
        d._children = d.children;
        d._children.forEach((d:any)=>{collapse(d)});
        d.children = null;
      }
    }

    function update(source: any) {
      // Assigns the x and y position for the nodes
      var treeData = treemap(root);

      // Compute the new tree layout.
      var nodes = treeData.descendants(),
        links = treeData.descendants().slice(1);

      // Normalize for fixed-depth.
      nodes.forEach(function (d) {
        d.y = d.depth * 180;
      });

      // ****************** Nodes section ***************************

      // Update the nodes...
      var node = svg.selectAll("g.node").data(nodes, function (d: any) {
        return d.id || (d.id = ++i);
      });

      // Enter any new modes at the parent's previous position.
      var nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function (source: any) {
          return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on("click", click);

      // Add Circle for the nodes
      nodeEnter
        .append("circle")
        .attr('class', 'node')
        .attr("r", 1e-6)
        .style("fill", function (d: any) {
          return d._children ? "lightsteelblue" : "#fff";
        });

      // Add labels for the nodes
      nodeEnter
        .append("text")
        .attr("dy", ".35em")
        .attr("x", function (d: any) {
          return d.children || d._children ? -13 : 13;
        })
        .attr("text-anchor", function (d: any) {
          return d.children || d._children ? "end" : "start";
        })
        .text(function (d: any) {
          return d.data.name;
        });

      // UPDATE
      var nodeUpdate = nodeEnter.merge(svg.selectAll("g.node"));

      // Transition to the proper position for the node
      nodeUpdate
        .transition()
        .duration(duration)
        .attr("transform", function (d) {
          return "translate(" + d.y + "," + d.x + ")";
        });

      // Update the node attributes and style
      nodeUpdate
        .select("circle.node")
        .attr("r", 10)
        .style("fill", function (d: any) {
          return d._children ? "lightsteelblue" : "#fff"
        })
        .attr("cursor", "pointer");

      // Remove any exiting nodes
      var nodeExit = node
        .exit()
        .transition()
        .duration(duration)
        .attr("transform", function (source: any) {
          return "translate(" + source.y + "," + source.x + ")";
        })
        .remove();

      // On exit reduce the node circles size to 0
      nodeExit.select("circle").attr("r", 1e-6);

      // On exit reduce the opacity of text labels
      nodeExit.select("text").style("fill-opacity", 1e-6);

      // ****************** links section ***************************

      // Update the links...
      var link = svg.selectAll("path.link").data(links, function (d: any) {
        return d.id;
      });

      // Enter any new links at the parent's previous position.
      var linkEnter = link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .attr("d", function (d) {
          var o = { x: source.x0, y: source.y0 };
          return diagonal(o, o);
        })
        // .style("stroke", "lightgrey")
        // .style("stroke-opacity", 0.5)
        // .style("stroke-width", 1)
        // .style("fill", "none");

      // UPDATE
      //   var linkUpdate = linkEnter.merge(link);
      var linkUpdate = linkEnter.merge(svg.selectAll("path.link"));

      // Transition back to the parent element position
      linkUpdate
        .transition()
        .duration(duration)
        .attr("d", function (d) {
          return diagonal(d, d.parent);
        });

      // Remove any exiting links
      // var linkExit = link
      link
        .exit()
        .transition()
        .duration(duration)
        .attr("d", function (d) {
          var o = { x: source.x, y: source.y };
          return diagonal(o, o);
        })
        .remove();

      // Store the old positions for transition.
      nodes.forEach(function (d: any) {
        d.x0 = d.x;
        d.y0 = d.y;
      });

      // Creates a curved (diagonal) path from parent to the child nodes
      // function diagonalOLD(s: any, d: any) {
      //   const path = `M ${s.y} ${s.x}
      //         S ${(s.y + d.y) / 2} ${s.x},
      //           ${(s.y + d.y) / 2} ${d.x},
      //           ${d.y} ${d.x}`;

      //   return path;
      // }

      // Creates a curved (diagonal) path from parent to the child nodes
      function diagonal(s: any, d: any) {
        const path = `M ${s.y} ${s.x}
          C ${(s.y + d.y) / 2} ${s.x},
           ${(s.y + d.y) / 2} ${d.x},
           ${d.y} ${d.x}`;

        return path;
      }

      // Toggle children on click.
      function click(d: any) {
        if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
        update(d);
      }
    }
  };
}
