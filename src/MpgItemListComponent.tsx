import React from "react";
import MpgItem, { MpgItemState, MpgItemPrivacy } from "./MpgItem";
import {
  Card,
  CardActionArea,
  Typography,
  Icon,
  Tooltip,
  TextField,
  Chip,
  Button,
} from "@material-ui/core";
import MpgTheme from "./MpgTheme";
import { MpgItemType } from "./MpgItemType";

interface IconInfo {
  index: number;
  iconName: string;
  iconToolTipText: string;
  onClickFunction: Function;
  color: string;
}
interface IMpgItemListComponentProps {
  items: Map<string, MpgItem>;
  openItem: Function;
  removeFromListEnabled: boolean;
  removeFromListFun: Function;
  removeFromListToolTip: string;
  deleteItem: Function;
  updateItem: Function;
  refreshItem: Function;
  showArchived: boolean;
  removeTagFromItem: Function;
  showActive: boolean;
  showParked: boolean;
  showTime?: boolean;
  sortOnlyTimeAscending?: boolean;
  setDataSavingInProgress: Function
  privateMode: boolean
}
interface IMpgItemListCompenentState {
  items: Map<string, MpgItem>;
  showArchived: Boolean;
  parkUntilText: string;
  priorityText: string;
  showActive: boolean;
  showParked: boolean;
  showTime: boolean;
  sortOnlyTimeAscending?: boolean;
  privacyFilter: boolean;
}

export default class MpgItemListCompenent extends React.Component<
  IMpgItemListComponentProps,
  IMpgItemListCompenentState
> {
  private cardIcons: IconInfo[] = [];
  private postiveEmoji = "😀";
  private negativeEmoji = "🙁";
  constructor(props: IMpgItemListComponentProps) {
    super(props);
    const showTime = props.showTime !== undefined ? props.showTime : false;
    const sortOnlyTimeAscending =
      props.sortOnlyTimeAscending !== undefined
        ? props.sortOnlyTimeAscending
        : false;
    this.state = {
      items: props.items,
      showArchived: props.showArchived,
      parkUntilText: "1h",
      priorityText: "0",
      showActive: props.showActive,
      showParked: props.showParked,
      showTime: showTime,
      sortOnlyTimeAscending: sortOnlyTimeAscending,
      privacyFilter: props.privateMode,
    };
    // expand first item
    // this.expnandFirstItem()
  }

  // expnandFirstItem = ()=>{
  //   this.getItemsToShowSorted()[0].cardExpanded = true
  // }

  static getDerivedStateFromProps = (
    newProps: IMpgItemListComponentProps,
    state: IMpgItemListCompenentState
  ) => {
    state = {
      ...state,
      items: newProps.items,
      showArchived: newProps.showArchived,
      privacyFilter: newProps.privateMode,
    };
    return state;
  };

  initIconInfoList = () => {
    this.cardIcons.push({
      index: 1,
      iconName: "keyboard_arrow_up",
      iconToolTipText: "Increase priority of item by 10",
      onClickFunction: this.handleIncrementPriority,
      color: MpgTheme.palette.primary.dark,
    });
    this.cardIcons.push({
      index: 2,
      iconName: "keyboard_arrow_down",
      iconToolTipText: "Decrease priority of item by 10",
      onClickFunction: this.handleDecrementPriority,
      color: MpgTheme.palette.primary.dark,
    });
    // this.cardIcons.push({
    //   index: 5,
    //   iconName: "query_builder",
    //   iconToolTipText: "Park item for 60 minutes",
    //   onClickFunction: this.handleParkItem,
    //   color: MpgTheme.palette.primary.dark,
    // });
    // this.cardIcons.push({
    //   index: 6,
    //   iconName: "archive",
    //   iconToolTipText: "Archive",
    //   onClickFunction: this.handleArchiveItem,
    //   color: MpgTheme.palette.primary.dark,
    // });
    if (this.props.removeFromListEnabled) {
      this.cardIcons.push({
        index: 3,
        iconName: "clear",
        iconToolTipText: this.props.removeFromListToolTip,
        onClickFunction: this.props.removeFromListFun,
        color: MpgTheme.palette.secondary.dark,
      });
    }
    this.cardIcons.push({
      index: 4,
      iconName: "delete",
      iconToolTipText: "Delete item",
      onClickFunction: this.handleDeleteItem,
      color: MpgTheme.palette.secondary.dark,
    });
  };

  handleIncrementPriority = async(item: MpgItem) => {
    this.props.setDataSavingInProgress(true)
    item.priority += 10;
    // item.cardExpanded = false;
    await this.props.updateItem(item);
    this.props.setDataSavingInProgress(false)
  };

  handleDecrementPriority = async(item: MpgItem) => {
    this.props.setDataSavingInProgress(true)
    item.priority -= 10;
    // item.cardExpanded = false;
    await this.props.updateItem(item);
    this.props.setDataSavingInProgress(false)
  };

  doNothing = () => {
    // placeholder for disabled operations
  };

  renderIcons = (item: MpgItem) => {
    return (
      <div
        style={{ display: "flex", justifyContent: "space-between", margin: 5 }}
      >
        {this.cardIcons.map((card) => (
          <Tooltip key={card.index} title={card.iconToolTipText}>
            <Icon
              key={card.index}
              style={{ fontSize: "14px", color: card.color }}
              onClick={(event) => card.onClickFunction(item)}
            >
              {card.iconName}
            </Icon>
          </Tooltip>
        ))}
      </div>
    );
  };

  render = () => {
    return <div>{this.renderItemList()}</div>;
  };

  isAncestorInList = (item: MpgItem): boolean => {
    let ancestorIsInList = false;
    item.getAncestors().forEach((ancestor) => {
      if (this.state.items.get(ancestor.id) !== undefined) {
        ancestorIsInList = true;
        return ancestorIsInList;
      }
    });
    return ancestorIsInList;
  };

  getItemsToShowSorted = (): MpgItem[] => {
    const itemsToShow = new Map<string, MpgItem>();
    // get active items with no parents or ancestors is not in list
    this.state.items.forEach((item) => {
      if (
        ((this.state.showArchived && item.state === MpgItemState.Archived) ||
          (this.state.showActive && item.state === MpgItemState.Active) ||
          (this.state.showParked && item.state === MpgItemState.Parked)) &&
        (item.parentRels.size === 0 || !this.isAncestorInList(item))
        // we need to include a flag to show all childrens
      ) {
        itemsToShow.set(item.id, item);
      }
    });
    let itemListSorted = Array.from(itemsToShow.values());
    if (!this.state.sortOnlyTimeAscending) {
      const itemListSortedByDate = Array.from(itemsToShow.values()).sort(
        (item1, item2) => {
          return item1.updatedAt.getTime() - item2.updatedAt.getTime();
        }
      );
      itemListSorted = itemListSortedByDate.sort((item1, item2) => {
        return item2.netPriority - item1.netPriority;
      });
    } else {
      itemListSorted = Array.from(itemsToShow.values()).sort((item1, item2) => {
        return item1.updatedAt.getTime() - item2.updatedAt.getTime();
      });
    }
    return itemListSorted;
  };

  renderItemList = () => {
    const itemListSorted = this.getItemsToShowSorted();
    return <div>{itemListSorted.map((item) => this.renderCard(item))}</div>;
  };

  renderCard = (item: MpgItem) => {
    let sentimentEmoji = "😐";
    if (item.type === MpgItemType.Entry) {
      if (item.netSentiment > 0) {
        sentimentEmoji = this.postiveEmoji;
      }
      if (item.netSentiment < 0) {
        sentimentEmoji = this.negativeEmoji;
      }
    }
    let timeText = "";
    if (this.state.showTime) {
      let hours = item.updatedAt.getHours();
      let amPm = " AM";
      if (hours > 12) {
        hours -= 12;
        amPm = " PM";
      } else {
        if (hours === 12) {
          amPm = " PM";
        } else {
          if (hours === 0) {
            hours = 12;
            amPm = " AM";
          }
        }
      }
      const minutes = item.updatedAt.getMinutes();
      const formattedMinutes = ("0" + minutes).slice(-2);
      timeText = hours + ":" + formattedMinutes + amPm + " ";
    }
    let itemHeadline = item.headline;
    if (this.state.privacyFilter && item.privacy === MpgItemPrivacy.Private) {
      itemHeadline = "************************";
    }
    return (
      <Card
        key={item.id}
        elevation={1}
        style={{ textAlign: "left", margin: 5, padding: 0 }}
      >
        <div style={{ display: "flex" }}>
          {item.childRels.size > 0 ? (
            <Tooltip title="Show children">
              <Icon
                style={{ margin: 0, color: MpgTheme.palette.primary.dark }}
                onClick={(event) => this.toggleChildrenExpanded(item)}
              >
                arrow_right
              </Icon>
            </Tooltip>
          ) : (
            <div style={{ width: 26 }}></div>
          )}
          <CardActionArea
            onClick={(event) => this.handleCardClicked(event, item)}
            // onKeyPress={event=> this.handleKeyPressed(event)}
          >
            <Typography
              style={{
                fontSize: "12px",
                fontWeight: "bold",
                color: MpgTheme.palette.primary.dark,
              }}
              align="left"
            >
              {/* {timeText + sentimentEmoji + item.headline} */}
              {timeText + sentimentEmoji + itemHeadline}
            </Typography>
          </CardActionArea>
          {item.cardExpanded ? (
            <Tooltip title="Contract">
              <Icon
                style={{ margin: 0, color: MpgTheme.palette.primary.dark }}
                onClick={(event) => this.toggleCardExpanded(item)}
              >
                arrow_drop_up
              </Icon>
            </Tooltip>
          ) : (
            <Tooltip title="Expand">
              <Icon
                style={{ margin: 0, color: MpgTheme.palette.primary.dark }}
                onClick={(event) => this.toggleCardExpanded(item)}
              >
                arrow_drop_down
              </Icon>
            </Tooltip>
          )}
        </div>
        {item.cardExpanded ? this.renderItemDetails(item) : <div></div>}
        {this.renderItemChildren(item)}
      </Card>
    );
  };

  handleKeyPressed = async (event: any) => {
    // if (event.key === "Enter") {
    //   this.setState({ itemDataChanged: true });
    // }
  };

  toggleChildrenExpanded = (item: MpgItem) => {
    item.childrenExpended = !item.childrenExpended;
    const items = this.state.items;
    this.setState({ items: items });
  };

  contractAllItems = () => {
    this.state.items.forEach((item) => {
      item.cardExpanded = false;
    });
  };
  contractChildrenForAllItems = () => {
    this.state.items.forEach((item) => {
      item.childrenExpended = false;
    });
  };

  toggleCardExpanded = (item: MpgItem) => {
    if (item.cardExpanded) {
      item.cardExpanded = false;
    } else {
      this.contractAllItems();
      item.cardExpanded = true;
    }
    const items = this.state.items;
    this.setState({ items: items });
  };

  renderItemChildren = (item: MpgItem) => {
    return (
      <div>
        {item.childRels.size > 0 && item.childrenExpended
          ? this.renderChildListComponent(item)
          : this.renderNothing()}
      </div>
    );
  };

  renderNothing = () => {
    return <div></div>;
  };

  renderChildListComponent = (item: MpgItem) => {
    const children = new Array<MpgItem>();
    item.childRels.forEach((parentRel) => {
      children.push(parentRel.child);
    });
    // filter iactive items
    // const activeChildItems = new Map<string, MpgItem>();
    // childItems.forEach(item => {
    //   if (item.state === MpgItemState.Active) {
    //     activeChildItems.set(item.id, item);
    //   }
    // });
    return (
      <div
        style={{
          margin: 0,
          paddingLeft: 4,
          paddingTop: 4,
          paddingBottom: 4,
          backgroundColor: MpgTheme.palette.primary.light,
        }}
      >
        {children.map((item) => this.renderCard(item))}
      </div>
    );
  };

  handleCardClicked = (event: any, item: MpgItem) => {
    this.props.openItem(item);
  };

  renderItemDetails = (item: MpgItem) => {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        {this.renderState(item)}
        {this.renderItemPrivacy(item)}
        {this.renderItemPriority(item)}
        {this.renderItemSentiment(item)}
        {this.renderItemCreatedAT(item)}
        {this.renderItemUpdatedAT(item)}
        {this.renderItemTags(item)}
        {this.renderParkUntil(item)}
        {this.renderItemActionIcons(item)}
      </div>
    );
  };

  renderItemTags = (item: MpgItem) => {
    return (
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center" }}>
        <Typography
          style={{
            fontSize: "12px",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
            marginRight: 5,
          }}
          align="left"
        >
          Tags:
        </Typography>
        {Array.from(item.tagRels.values()).map((tagRel) => (
          <Chip
            key={tagRel.id}
            label={tagRel.tag.headline}
            color="primary"
            size="small"
            onDelete={(event) =>
              this.props.removeTagFromItem(item, tagRel.tag.id)
            }
            onClick={(event) => this.props.openItem(tagRel.tag)}
            variant="outlined"
            style={{
              margin: "5px",
              fontSize: "9px",
            }}
          />
        ))}
      </div>
    );
  };

  renderItemActionIcons = (item: MpgItem) => {
    return (
      <div
        style={{
          display: "flex",
          // alignItems: "center",
          justifyContent: "space-between",
          margin: 5,
        }}
      >
        {/* <Tooltip title="Park">
          <Icon
            onClick={(event) => this.handleParkItem(item)}
            style={{ fontSize: "16px", color: MpgTheme.palette.secondary.dark }}
          >
            query_builder
          </Icon>
        </Tooltip> */}
        {item.state === MpgItemState.Archived ||
        item.state === MpgItemState.Parked ? (
          <Tooltip title="Make active">
            <Icon
              onClick={(event) => this.handleMaketemActive(item)}
              style={{
                fontSize: "16px",
                color: MpgTheme.palette.secondary.dark,
              }}
            >
              unarchive
            </Icon>
          </Tooltip>
        ) : (
          <Tooltip title="Archive">
            <Icon
              onClick={(event) => this.handleArchiveItem(item)}
              style={{
                fontSize: "16px",
                color: MpgTheme.palette.secondary.dark,
              }}
            >
              archive
            </Icon>
          </Tooltip>
        )}
        <Tooltip title="Increment priority by 10">
          <Icon
            onClick={(event) => this.handleIncrementPriority(item)}
            style={{ fontSize: "16px", color: MpgTheme.palette.secondary.dark }}
          >
            keyboard_arrow_up
          </Icon>
        </Tooltip>
        <Tooltip title="decrement priority by 10">
          <Icon
            onClick={(event) => this.handleDecrementPriority(item)}
            style={{ fontSize: "16px", color: MpgTheme.palette.secondary.dark }}
          >
            keyboard_arrow_down
          </Icon>
        </Tooltip>
        {this.props.removeFromListEnabled ? (
          <Tooltip title={this.props.removeFromListToolTip}>
            <Icon
              onClick={(event) => this.props.removeFromListFun(item)}
              style={{
                fontSize: "16px",
                color: MpgTheme.palette.secondary.dark,
              }}
            >
              clear
            </Icon>
          </Tooltip>
        ) : (
          <div></div>
        )}
        <Tooltip title="Delete">
          <Icon
            onClick={(event) => this.handleDeleteItem(item)}
            style={{ fontSize: "16px", color: MpgTheme.palette.secondary.dark }}
          >
            delete
          </Icon>
        </Tooltip>
      </div>
    );
  };

  renderState = (item: MpgItem) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          marginTop: 5,
        }}
      >
        <Typography
          style={{
            fontSize: "12px",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {"State: "}
        </Typography>
        <Typography
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {item.state}
        </Typography>
        {item.state === MpgItemState.Parked ? (
          this.renderParkedUntilValue(item)
        ) : (
          <div></div>
        )}
        {/* {this.renderStateChangeIcons(item)} */}
      </div>
    );
  };

  renderParkedUntilValue = (item: MpgItem) => {
    return (
      <div>
        <Typography
          style={{
            fontSize: "12px",
            fontWeight: "bold",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {"(" + item.parkedUntil.toString().substring(0, 24) + ")"}
        </Typography>
      </div>
    );
  };

  renderItemPriority = (item: MpgItem) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <Typography
          style={{
            fontSize: "10px",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {"Prioity: "}
        </Typography>
        <Typography
          style={{
            fontSize: "10px",
            fontWeight: "bold",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {item.priority + " (" + item.netPriority + ")"}
        </Typography>
      </div>
    );
  };

  renderItemPrivacy = (item: MpgItem) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <Typography
          style={{
            fontSize: "10px",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {"Privacy: "}
        </Typography>
        <Typography
          style={{
            fontSize: "10px",
            fontWeight: "bold",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {item.privacy}
        </Typography>
      </div>
    );
  };

  renderItemCreatedAT = (item: MpgItem) => {
    const createdAtDate = item.createdAt.toString().split("GMT")[0];
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <Typography
          style={{
            fontSize: "10px",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {"Created at: "}
        </Typography>
        <Typography
          style={{
            fontSize: "10px",
            fontWeight: "bold",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {createdAtDate}
        </Typography>
      </div>
    );
  };

  renderItemUpdatedAT = (item: MpgItem) => {
    const updatedAtDate = item.updatedAt.toString().split("GMT")[0];
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <Typography
          style={{
            fontSize: "10px",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {"Updated at: "}
        </Typography>
        <Typography
          style={{
            fontSize: "10px",
            fontWeight: "bold",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {updatedAtDate}
        </Typography>
      </div>
    );
  };

  renderItemSentiment = (item: MpgItem) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <Typography
          style={{
            fontSize: "10px",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {"Sentiment: "}
        </Typography>
        <Typography
          style={{
            fontSize: "10px",
            fontWeight: "bold",
            color: MpgTheme.palette.primary.dark,
            marginLeft: 5,
          }}
          align="left"
        >
          {item.sentiment.toFixed(2) + "(" + item.netSentiment.toFixed(2) + ")"}
        </Typography>
      </div>
    );
  };

  renderStateChangeIcons = (item: MpgItem) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginLeft: 15,
        }}
      >
        {item.state === MpgItemState.Archived ? (
          <Tooltip title="Unarchive">
            <Icon
              onClick={(event) => this.handleMaketemActive(item)}
              style={{ fontSize: "12px" }}
            >
              unarchive
            </Icon>
          </Tooltip>
        ) : (
          <Tooltip title="Archive">
            <Icon
              onClick={(event) => this.handleArchiveItem(item)}
              style={{ fontSize: "12px" }}
            >
              archive
            </Icon>
          </Tooltip>
        )}
        <Tooltip title="Park for 1 hour">
          <Icon
            onClick={(event) => this.handleParkItem(item)}
            style={{ fontSize: "12px", marginLeft: 15 }}
          >
            query_builder
          </Icon>
        </Tooltip>
      </div>
    );
  };

  renderParkUntil = (item: MpgItem) => {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginLeft: 5,
        }}
      >
        <TextField
          error={!this.isParkUnitlValueValid()}
          autoFocus
          helperText={
            !this.isParkUnitlValueValid()
              ? "Must be a number followed by h,d,w or m"
              : ""
          }
          id="parkuntil"
          label="Park for (Hours, Days, etc)"
          value={this.state.parkUntilText}
          style={{ width: "60%", fontSize: "9px", height: "10%", margin: 0 }}
          onChange={this.handleParkUntilTextChanged}
          onFocus={(event) => event.target.select()}
        />
        <Button
          onClick={() => this.handleParkItem(item)}
          style={{
            margin: 5,
            color: MpgTheme.palette.primary.contrastText,
            backgroundColor: MpgTheme.palette.primary.main,
            fontSize: "9px",
          }}
          size="small"
          // color="secondary"
        >
          Park
        </Button>
      </div>
    );
  };

  // renderPriority = (item: MpgItem) => {
  //   return (
  //     <div style={{ display: "flex" }}>
  //       <TextField
  //         error={isNaN(parseInt(this.state.priorityText))}
  //         helperText={
  //           isNaN(parseInt(this.state.priorityText)) ? "Must be a number" : ""
  //         }
  //         id="itemPriority"
  //         label="Priority"
  //         value={this.state.priorityText}
  //         margin="normal"
  //         style={{ marginLeft: 10, width: "20%" }}
  //         onChange={this.handleParkUntilTextChanged}
  //         // onKeyPress={this.handleKeyPressed}
  //         // onBlur={(event) => this.handlePriorityTextBlurred(event, item)}
  //       />
  //       <TextField
  //         id="itemNetPriority"
  //         label="Net priority"
  //         value={item.netPriority}
  //         margin="normal"
  //         style={{ marginLeft: 40, width: "30%" }}
  //         InputProps={{
  //           readOnly: true,
  //         }}
  //       />
  //     </div>
  //     // <div
  //     //   style={{
  //     //     display: "flex",
  //     //     alignItems: "center",
  //     //     justifyContent: "space-between",
  //     //     alignContent:"center",
  //     //     marginLeft: 5,
  //     //   }}
  //     // >
  //     //   <TextField
  //     //     error={isNaN(parseInt(this.state.priorityText))}
  //     //     helperText={
  //     //       isNaN(parseInt(this.state.priorityText)) ? "Must be a number" : ""
  //     //     }
  //     //     id="priority"
  //     //     label="Priority"
  //     //     value={this.state.priorityText}
  //     //     style={{ width: "50%", fontSize: "9px", height: "10%", margin: 0 }}
  //     //     onChange={this.handlePriorityTextChanged}
  //     //     onBlur={(event) => this.handlePriorityTextBlurred(event, item)}
  //     //   />
  //     //   <TextField
  //     //     id="itemNetPriority"
  //     //     label="Net priority"
  //     //     value={item.netPriority}
  //     //     margin="normal"
  //     //     style={{width: "60%" }}
  //     //     InputProps={{
  //     //       readOnly: true,
  //     //     }}
  //     //   />
  //     // </div>
  //   );
  // };

  handleParkUntilTextChanged = async (event: React.ChangeEvent) => {
    const parkUntiltext = (event.target as HTMLInputElement).value;
    // validate
    this.setState({ parkUntilText: parkUntiltext });
  };

  isParkUnitlValueValid = (): boolean => {
    let parkUtillValid = false;
    if (this.parseParkUtillText() > 0) {
      parkUtillValid = true;
    }
    return parkUtillValid;
  };

  parseParkUtillText = (): number => {
    const parkUntilText = this.state.parkUntilText
    // console.log("parseParkUntilText: parkUntilText:",parkUntilText)
    let returnParsedValue: number = 0;
    if (parkUntilText.length >= 2) {
      // console.log("parseParkUntilText: length > 20:")
          // console.log("parseParkUntilText: length >= 2")
          const timeCharacter = parkUntilText.slice(-1);
          // console.log(
          //   "parseParkUntilText: last character:",
          //   timeCharacter,
          // );
          const parsedTimeValue = parseInt(parkUntilText);
          if (!isNaN(parsedTimeValue)) {
            // console.log("parseParkUntilText: parsed time value:",parsedTimeValue)
            switch (timeCharacter.toLowerCase()) {
              case "h":
                returnParsedValue = parsedTimeValue 
                break;
              case "d":
                returnParsedValue = parsedTimeValue * 24;
                break;
              case "w":
                returnParsedValue = parsedTimeValue * 24 * 7;
                break;
              case "m":
                returnParsedValue = parsedTimeValue * 24 * 30
                break;
              default:
                returnParsedValue = 0
                break;
            }
        }else{
          // parsed number is NaN
          returnParsedValue = 0
        }
    }
    // console.log(
    //   "parseParkUntilText: returnParsedValue:",
    //   returnParsedValue
    // );
    return returnParsedValue;
  };

  // handleParkUntilTextBlurred = async (
  //   event: React.ChangeEvent,
  //   item: MpgItem
  // ) => {
  //   await this.handleParkItem(item);
  // };

  // handlePriorityTextBlurred = async (
  //   event: React.ChangeEvent,
  //   item: MpgItem
  // ) => {
  //   if (!isNaN(parseInt(this.state.priorityText))) {
  //     item.priority = parseInt(this.state.priorityText);
  //   } else {
  //     item.priority = 0;
  //   }
  //   await this.props.updateItem(item);
  // };

  handlePriorityTextChanged = async (event: React.ChangeEvent) => {
    const prioritytext = (event.target as HTMLInputElement).value;
    this.setState({ priorityText: prioritytext });
  };

  handleParkItem = async (item: MpgItem) => {
    // let parkUntilHours = this.parseParkUtillText()
    // if (!isNaN(parseInt(this.state.parkUntilText))) {
    //   parkUntilHours = this.parseParkUtillText()
    // }
    // if(this.parseParkUtillText() !== 0){
    //   parkUntilHours = this.parseParkUtillText()
    // }
    this.props.setDataSavingInProgress(true)
    item.park(this.parseParkUtillText());
    item.priority += 2;
    await this.props.updateItem(item);
    const items = this.state.items;
    await this.setState({ items: items });
    await this.props.refreshItem();
    this.props.setDataSavingInProgress(false)
    // await this.expnandFirstItem()
  };

  handleArchiveItem = async (item: MpgItem) => {
    if (
      item.state === MpgItemState.Active ||
      item.state === MpgItemState.Parked
    ) {
      this.props.setDataSavingInProgress(true)
      item.archive();
      await this.props.updateItem(item);
      const items = this.state.items;
      await this.setState({ items: items });
      await this.props.refreshItem();
      this.props.setDataSavingInProgress(false)
    }
  };

  handleMaketemActive = async (item: MpgItem) => {
    item.makeActive();
    this.props.setDataSavingInProgress(true)
    await this.props.updateItem(item);
    const items = this.state.items;
    this.setState({ items: items });
    this.props.refreshItem();
    this.props.setDataSavingInProgress(false)
  };

  handleDeleteItem = async (item: MpgItem) => {
    // console.log("ItemListComponent: handleDeleteItem: item:",item)
    this.props.setDataSavingInProgress(true)
    await this.props.deleteItem(item);
    this.props.refreshItem();
    this.props.setDataSavingInProgress(false)
  };
}
