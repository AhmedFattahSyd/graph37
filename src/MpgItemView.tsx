import React from "react";
import {
  Card,
  Typography,
  TextField,
  Button,
  ThemeProvider,
  Tooltip,
  Icon,
  CircularProgress,
  Select,
  MenuItem,
} from "@material-ui/core";
import MpgTheme from "./MpgTheme";
import MpgItem, { MpgItemState, MpgItemPrivacy } from "./MpgItem";
import MpgPanel, { PanelInterface } from "./MpgPanel";
import MpgTagsComponent from "./MpgTagsComponent";
import MpgItemEntriesComponent from "./MpgEntriesComponent";
import MpgTag from "./MpgTag";
import MpgEntry from "./MpgEntry";
import { MpgItemType } from "./MpgItemType";
import MpgChildParentComponent from "./MpgChildParentComponent";
import MpgList from "./MpgList";

interface IMpgItemViewProps {
  currentItem: MpgItem;
  entries: Map<string, MpgEntry>;
  openItem: Function;
  viewWidth: number;
  closeView: Function;
  updateItem: Function;
  deleteItem: Function;
  tagItemWithNewTag: Function;
  tagItemWithExistingTag: Function;
  removeTagFromItem: Function;
  addNewEntryToEntriesOfEntry: Function;
  addExistingEntryToEntriesOfEntry: Function;
  tags: Map<string, MpgTag>;
  addNewChildFromNewItem: Function;
  addChildFromExistingItem: Function;
  addNewParentFromNewItem: Function;
  addParentFromExistingItem: Function;
  lists: Map<string, MpgList>;
  removeParentChildRel: Function;
  removeEntryFromItem: Function;
  viewMargin: number;
  setDataSavingInprogress: Function;
  // existingEntries: Map<string,MpgEntry>
  privateMode: boolean
}

interface IMpgItemViewState {
  items: Map<string, MpgItem>;
  currentItem: MpgItem;
  headlineText: string;
  itemDataChanged: boolean;
  notesText: string;
  // itemPriority: string;
  priorityText: string;
  priorityValueInvalid: boolean;
  tags: Map<string, MpgTag>;
  dataSavingInProgress: boolean;
  sentimentText: string;
  netSentimentText: string;
  overrideSentiment: boolean;
  privacy: MpgItemPrivacy;
  // existingEntries: Map<string,MpgEntry>
}

export default class MpgItemView extends React.Component<
  IMpgItemViewProps,
  IMpgItemViewState
> {
  private panelList: PanelInterface[] = [];
  private renderHeaderFun: Function;

  constructor(props: IMpgItemViewProps) {
    super(props);
    // const existingEntries = this.getExistingEntries(props.currentItem)
    this.state = {
      items: props.entries,
      currentItem: props.currentItem,
      headlineText: props.currentItem.headline,
      itemDataChanged: false,
      notesText: props.currentItem.notes,
      // itemPriority: props.currentItem.priority.toString(),
      priorityText: props.currentItem.priority.toString(),
      priorityValueInvalid: false,
      tags: new Map(),
      dataSavingInProgress: false,
      sentimentText: props.currentItem.sentiment.toFixed(2),
      netSentimentText: props.currentItem.netSentiment.toFixed(2),
      overrideSentiment: false,
      privacy: this.props.currentItem.privacy,
      // existingEntries: props.existingEntries,
    };
    this.renderHeaderFun = this.renderEntryHeader;
    this.initViewParameters();
  }

  public setDataSavingInprogress = (dataSavingInProgress: boolean) => {
    this.props.setDataSavingInprogress(dataSavingInProgress);
    this.setState({ dataSavingInProgress: dataSavingInProgress });
  };

  private doNothing = () => {
    // do nothing for disabled operations
  };

  private initViewParameters = () => {
    switch (this.props.currentItem.type) {
      case MpgItemType.Entry:
        this.initEntryViewParameters();
        break;
      case MpgItemType.Tag:
        this.initTagViewParameters();
        break;
      case MpgItemType.List:
        this.initListViewParameters();
        break;
      default:
        throw new Error(
          `MpgItemView: initPanelList: invalid item type: ${this.props.currentItem.type}`
        );
    }
  };

  private initEntryViewParameters = () => {
    this.panelList.push({
      index: 0,
      renderLabelFun: this.renderHeadlinePanelLabel,
      renderDetailsFun: this.renderHeadlinePanelDetails,
      initialStateOpen: true,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 1,
      renderLabelFun: this.renderTagsPanelLabel,
      renderDetailsFun: this.renderTagsPanelDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 2,
      renderLabelFun: this.renderPriorityLabel,
      renderDetailsFun: this.renderPrioritiesDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    // this.panelList.push({
    //   index: 3,
    //   renderLabelFun: this.renderActiveEntriesPanelLabel,
    //   renderDetailsFun: this.renderActiveEntriesPanelDetails,
    //   initialStateOpen: false,
    //   leftSideFunction: this.doNothing,
    //   leftSideFunctionEnabled: false,
    //   leftSideFunctionIcon: "",
    //   leftSideFunctionToolTip: "",
    // });
    this.panelList.push({
      index: 4,
      renderLabelFun: this.renderChildrenPanelLabel,
      renderDetailsFun: this.renderChildrenPanelDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 5,
      renderLabelFun: this.renderParentsPanelLabel,
      renderDetailsFun: this.renderParentsPanelDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.renderHeaderFun = this.renderEntryHeader;
  };

  private initListViewParameters = () => {
    this.panelList.push({
      index: 0,
      renderLabelFun: this.renderHeadlinePanelLabel,
      renderDetailsFun: this.renderHeadlinePanelDetails,
      initialStateOpen: true,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 1,
      renderLabelFun: this.renderTagsPanelLabel,
      renderDetailsFun: this.renderTagsPanelDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    // active entries
    this.panelList.push({
      index: 3,
      renderLabelFun: this.renderActiveEntriesPanelLabel,
      renderDetailsFun: this.renderActiveEntriesPanelDetails,
      initialStateOpen: true,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 6,
      renderLabelFun: this.renderParkedEntriesPanelLabel,
      renderDetailsFun: this.renderParkedEntriesPanelDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 7,
      renderLabelFun: this.renderArchivedEntriesPanelLabel,
      renderDetailsFun: this.renderArchivedEntriesPanelDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 2,
      renderLabelFun: this.renderPriorityLabel,
      renderDetailsFun: this.renderPrioritiesDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 4,
      renderLabelFun: this.renderChildrenPanelLabel,
      renderDetailsFun: this.renderChildrenPanelDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 5,
      renderLabelFun: this.renderParentsPanelLabel,
      renderDetailsFun: this.renderParentsPanelDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.renderHeaderFun = this.renderListHeader;
  };

  private initTagViewParameters = () => {
    this.panelList.push({
      index: 0,
      renderLabelFun: this.renderHeadlinePanelLabel,
      renderDetailsFun: this.renderHeadlinePanelDetails,
      initialStateOpen: true,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 1,
      renderLabelFun: this.renderTagEntriesPanelLabel,
      renderDetailsFun: this.renderActiveEntriesPanelDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 2,
      renderLabelFun: this.renderPriorityLabel,
      renderDetailsFun: this.renderPrioritiesDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 3,
      renderLabelFun: this.renderChildrenPanelLabel,
      renderDetailsFun: this.renderChildrenPanelDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.panelList.push({
      index: 4,
      renderLabelFun: this.renderParentsPanelLabel,
      renderDetailsFun: this.renderParentsPanelDetails,
      initialStateOpen: false,
      leftSideFunction: this.doNothing,
      leftSideFunctionEnabled: true,
      leftSideFunctionIcon: "",
      leftSideFunctionToolTip: "",
    });
    this.renderHeaderFun = this.renderTagHeader;
  };

  renderChildrenPanelDetails = () => {
    return (
      <MpgChildParentComponent
        tags={this.props.tags}
        currentItem={this.state.currentItem}
        openItem={this.props.openItem}
        entries={this.props.entries}
        deleteItem={this.props.deleteItem}
        updateItem={this.props.updateItem}
        refreshItem={this.refreshItem}
        addNewChildFromNewItem={this.props.addNewChildFromNewItem}
        addChildFromExistingItem={this.props.addChildFromExistingItem}
        childComponent={true}
        addNewParentFromNewItem={this.props.addNewParentFromNewItem}
        addParentFromExistingItem={this.props.addParentFromExistingItem}
        lists={this.props.lists}
        removeParentChildRel={this.props.removeParentChildRel}
        removeTagFromItem={this.props.removeTagFromItem}
        setDataSavingInProgress={this.props.setDataSavingInprogress}
        privateMode={this.props.privateMode}
      />
    );
  };

  renderParentsPanelDetails = () => {
    return (
      <MpgChildParentComponent
        tags={this.props.tags}
        currentItem={this.state.currentItem}
        openItem={this.props.openItem}
        entries={this.props.entries}
        deleteItem={this.props.deleteItem}
        updateItem={this.props.updateItem}
        refreshItem={this.refreshItem}
        addNewChildFromNewItem={this.props.addNewChildFromNewItem}
        addChildFromExistingItem={this.props.addChildFromExistingItem}
        childComponent={false}
        addNewParentFromNewItem={this.props.addNewParentFromNewItem}
        addParentFromExistingItem={this.props.addParentFromExistingItem}
        lists={this.props.lists}
        removeParentChildRel={this.props.removeParentChildRel}
        removeTagFromItem={this.props.removeTagFromItem}
        setDataSavingInProgress={this.props.setDataSavingInprogress}
        privateMode={this.props.privateMode}
      />
    );
  };

  private renderChildrenPanelLabel = () => {
    return `Children (${this.state.currentItem.childRels.size})`;
  };

  private renderParentsPanelLabel = () => {
    return `Parents (${this.state.currentItem.parentRels.size})`;
  };

  private renderTagEntriesPanelLabel = () => {
    return `Entries tagged with this tag (${this.state.currentItem.itemRels.size})`;
  };

  private renderActiveEntriesPanelLabel = () => {
    // return `Active entries with same tags (${this.getNumberOfActiveEntriesOfItem(
    //   this.state.currentItem
    // )})`;
    return `Active entries with same tags (${this.getNumberOfEntriesWithAllTagsOfItem(
      this.state.currentItem,
      MpgItemState.Active
    )})`;
  };

  private renderParkedEntriesPanelLabel = () => {
    return `Parked entries with same tags (${this.getNumberOfEntriesWithAllTagsOfItem(
      this.state.currentItem,
      MpgItemState.Parked
    )})`;
  };

  private renderArchivedEntriesPanelLabel = () => {
    return `Archived entries with same tags (${this.getNumberOfEntriesWithAllTagsOfItem(
      this.state.currentItem,
      MpgItemState.Archived
    )})`;
  };

  getNumberOfEntriesWithAllTagsOfItem = (
    item: MpgItem,
    state: MpgItemState
  ): number => {
    let numberOfEntriesWithAllTags = 0;
    this.props.entries.forEach((entry) => {
      if (entry.hasAllTags(item.tagRels) && entry.state === state) {
        numberOfEntriesWithAllTags += 1;
      }
    });
    return numberOfEntriesWithAllTags;
  };

  // getNumberOfActiveEntriesOfItem = (item: MpgItem): number => {
  //   let numberOfActiveEntries = 0;
  //   // console.log("getNumberOfActiveEntries: item:",item)
  //   item.entriesWithAllTags.forEach((entry) => {
  //     if (entry.state === MpgItemState.Active) numberOfActiveEntries += 1;
  //   });
  //   return numberOfActiveEntries;
  // };

  // getNumberOfParkedEntriesOfItem = (item: MpgItem): number => {
  //   let numberOfActiveEntries = 0;
  //   item.entriesWithAllTags.forEach((entry) => {
  //     if (entry.state === MpgItemState.Parked) numberOfActiveEntries += 1;
  //   });
  //   return numberOfActiveEntries;
  // };

  // getNumberOfArchivedEntriesOfItem = (item: MpgItem): number => {
  //   let numberOfArchivedEntries = 0;
  //   item.entriesWithAllTags.forEach((entry) => {
  //     if (entry.state === MpgItemState.Archived) numberOfArchivedEntries += 1;
  //   });
  //   return numberOfArchivedEntries;
  // };

  renderActiveEntriesPanelDetails = () => {
    return (
      <MpgItemEntriesComponent
        currentEntry={this.state.currentItem}
        openItem={this.props.openItem}
        // creatNewEntryAndTagItAndAddToItem={
        //   this.props.creatNewEntryAndTagItAndAddToItem
        // }
        // tagExistingEntryAndAddToItem={this.props.tagExistingEntryAndAddToItem}
        entries={this.props.entries}
        deleteItem={this.props.deleteItem}
        updateItem={this.props.updateItem}
        refreshItem={this.refreshItem}
        addNewEntryToEntriesOfItem={this.props.addNewEntryToEntriesOfEntry}
        addExistingEntryToEntriesOfEntry={
          this.props.addExistingEntryToEntriesOfEntry
        }
        removeEntryFromItem={this.props.removeEntryFromItem}
        removeTagFromItem={this.props.removeTagFromItem}
        showActive={true}
        showParked={false}
        showArchived={false}
        setDataSavingInProgress={this.setDataSavingInprogress}
        // existingEntries={this.state.existingEntries}
        privateMode={this.props.privateMode}
      />
    );
  };

  renderArchivedEntriesPanelDetails = () => {
    return (
      <MpgItemEntriesComponent
        currentEntry={this.state.currentItem}
        openItem={this.props.openItem}
        // creatNewEntryAndTagItAndAddToItem={
        //   this.props.creatNewEntryAndTagItAndAddToItem
        // }
        // tagExistingEntryAndAddToItem={this.props.tagExistingEntryAndAddToItem}
        entries={this.props.entries}
        deleteItem={this.props.deleteItem}
        updateItem={this.props.updateItem}
        refreshItem={this.refreshItem}
        addNewEntryToEntriesOfItem={this.props.addNewEntryToEntriesOfEntry}
        addExistingEntryToEntriesOfEntry={
          this.props.addExistingEntryToEntriesOfEntry
        }
        removeEntryFromItem={this.props.removeEntryFromItem}
        removeTagFromItem={this.props.removeTagFromItem}
        showActive={false}
        showParked={false}
        showArchived={true}
        setDataSavingInProgress={this.setDataSavingInprogress}
        // existingEntries={this.state.existingEntries}
        privateMode={this.props.privateMode}
      />
    );
  };

  renderParkedEntriesPanelDetails = () => {
    return (
      <MpgItemEntriesComponent
        currentEntry={this.state.currentItem}
        openItem={this.props.openItem}
        // creatNewEntryAndTagItAndAddToItem={
        //   this.props.creatNewEntryAndTagItAndAddToItem
        // }
        // tagExistingEntryAndAddToItem={this.props.tagExistingEntryAndAddToItem}
        entries={this.props.entries}
        deleteItem={this.props.deleteItem}
        updateItem={this.props.updateItem}
        refreshItem={this.refreshItem}
        addNewEntryToEntriesOfItem={this.props.addNewEntryToEntriesOfEntry}
        addExistingEntryToEntriesOfEntry={
          this.props.addExistingEntryToEntriesOfEntry
        }
        removeEntryFromItem={this.props.removeEntryFromItem}
        removeTagFromItem={this.props.removeTagFromItem}
        showActive={false}
        showParked={true}
        showArchived={false}
        setDataSavingInProgress={this.setDataSavingInprogress}
        // existingEntries={this.state.existingEntries}
        privateMode={this.props.privateMode}
      />
    );
  };

  private renderTagsPanelLabel = () => {
    return `Tags (${this.state.currentItem.tagRels.size})`;
  };

  renderTagsPanelDetails = () => {
    return (
      <MpgTagsComponent
        items={this.state.items}
        currentItem={this.state.currentItem}
        openItem={this.props.openItem}
        tagItemWithNewTag={this.props.tagItemWithNewTag}
        tagItemWithExistingTag={this.props.tagItemWithExistingTag}
        removeTagFromItem={this.props.removeTagFromItem}
        tags={this.props.tags}
        // setItemDataChanged={this.setItemDataChanged}
        setDataSavingInprogress={this.setDataSavingInprogress}
      />
    );
  };

  formateDate = (timestamp: Date) => {
    let dateString = timestamp.toString();
    let subStrings = dateString.split("GMT");
    return subStrings[0];
  };

  renderDate = (item: MpgItem) => {
    const dateString = this.formateDate(item.createdAt);
    const dateArray = dateString.split(" ");
    const day = dateArray[0];
    const month = dateArray[1];
    const dayOfMonth = dateArray[2];

    return (
      <div style={{ width: 40, marginRight: 10, textAlign: "center" }}>
        <Typography color="primary" variant="body2">
          {day}
        </Typography>
        <Typography color="primary" variant="h5">
          {dayOfMonth}
        </Typography>
        <Typography color="primary" variant="body2">
          {month}
        </Typography>
      </div>
    );
  };

  handlePriorityChanged = async (event: React.ChangeEvent) => {
    const priroty = (event.target as HTMLInputElement).value;
    this.setState({ priorityText: priroty, itemDataChanged: true });
  };

  handleSentimentChanged = async (event: React.ChangeEvent) => {
    const sentiment = (event.target as HTMLInputElement).value;
    this.setState({
      sentimentText: sentiment,
      itemDataChanged: true,
      overrideSentiment: true,
    });
  };

  renderPrioritiesDetails = () => {
    return (
      <Card
        elevation={1}
        style={{ textAlign: "left", margin: 0, padding: 3, width: "100%" }}
      >
        <div style={{ display: "flex" }}>
          <TextField
            error={isNaN(parseInt(this.state.priorityText))}
            helperText={
              isNaN(parseInt(this.state.priorityText)) ? "Must be a number" : ""
            }
            id="itemPriority"
            label="Priority"
            value={this.state.priorityText}
            margin="normal"
            style={{ marginLeft: 10, width: "20%" }}
            onChange={this.handlePriorityChanged}
            onKeyPress={this.handleKeyPressed}
            onBlur={this.updateItem}
          />
          <TextField
            id="itemNetPriority"
            label="Net priority"
            value={this.props.currentItem.netPriority}
            margin="normal"
            style={{ marginLeft: 40, width: "30%" }}
            InputProps={{
              readOnly: true,
            }}
          />
        </div>
      </Card>
    );
  };

  renderPriorityLabel = () => {
    return (
      "Priority " +
      this.state.currentItem.priority +
      " (" +
      this.state.currentItem.netPriority +
      ")"
    );
  };

  renderHeadlinePanelDetails = () => {
    // let sentimentEmoji = "😐";
    // if (this.state.currentItem.sentiment > 0) {
    //   sentimentEmoji = this.postiveEmoji;
    // }
    // if (this.state.currentItem.sentiment < 0) {
    //   sentimentEmoji = this.negativeEmoji;
    // }
    // let netSentimentEmoji = "😐";
    // if (this.state.currentItem.netSentiment > 0) {
    //   netSentimentEmoji = this.postiveEmoji;
    // }
    // if (this.state.currentItem.netSentiment < 0) {
    //   netSentimentEmoji = this.negativeEmoji;
    // }
    return (
      <Card elevation={1} style={{ textAlign: "left", margin: 5, padding: 3 }}>
        <div style={{ display: "flex" }}>
          {this.renderDate(this.state.currentItem)}
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Headline"
            fullWidth
            multiline
            value={this.state.headlineText}
            onKeyPress={this.handleKeyPressed}
            onChange={(event) => this.handleHeadlineChanged(event)}
            onBlur={this.updateItem}
            onFocus={(event) => event.target.select()}
          />
        </div>
        <TextField
          margin="dense"
          id="notes"
          label="Notes"
          fullWidth
          value={this.state.notesText}
          onChange={(event) => this.handleNotesChanged(event)}
          multiline
          onBlur={this.updateItem}
          style={{ fontSize: "5" }}
        />
        <div style={{ display: "flex", alignItems: "center" }}>
          <Typography
            style={{
              fontSize: "12px",
              color: MpgTheme.palette.primary.dark,
              marginTop: 5,
              marginLeft: 0,
              marginRight: 10,
              fontWeight: "bold",
            }}
            align="left"
          >
            Privacy level:
          </Typography>
          <Select
            labelId="privacyInputLabel"
            id="privacySelect"
            value={this.state.privacy}
            onChange={this.handlePrivacyChange}
          >
            <MenuItem value={MpgItemPrivacy.Public}>Public</MenuItem>
            <MenuItem value={MpgItemPrivacy.Community}>Community</MenuItem>
            <MenuItem value={MpgItemPrivacy.Personal}>Personal</MenuItem>
            <MenuItem value={MpgItemPrivacy.Private}>Private</MenuItem>
          </Select>
        </div>
        {/* <Typography
          style={{
            fontSize: "14px",
            color: MpgTheme.palette.primary.dark,
            marginTop: 5,
            marginLeft: 0,
            fontWeight: "bold",
          }}
          align="left"
        >
          {"Sentiment: " +
            this.state.currentItem.sentiment.toFixed(2) +
            "   " +
            sentimentEmoji +
            "(" +
            this.state.currentItem.netSentiment.toFixed(2) +
            ")   " +
            netSentimentEmoji}
        </Typography> */}
        {/* {this.state.currentItem.type === MpgItemType.Tag ? ( */}
        <div style={{ display: "flex" }}>
          <TextField
            error={!this.isValidSentiment()}
            helperText={
              !this.isValidSentiment() ? "Must be a number (-1:+1)" : ""
            }
            id="itemSentiment"
            label="Override sentiment"
            value={this.state.sentimentText}
            margin="normal"
            style={{ marginLeft: 10, width: "40%" }}
            onChange={this.handleSentimentChanged}
            onBlur={this.updateItem}
          />
          {/* ) : (
          <div></div>
        )} */}
          <TextField
            id="itemNetSentiment"
            label="Net sentiment"
            value={this.state.netSentimentText}
            margin="normal"
            style={{ marginLeft: 40, width: "30%" }}
            InputProps={{
              readOnly: true,
            }}
          />
        </div>
      </Card>
    );
  };

  handlePrivacyChange = async (event: React.ChangeEvent<{ value: any }>) => {
    const privacy: MpgItemPrivacy = event.target.value;
    await this.setState({ privacy: privacy, itemDataChanged: true });
    await this.updateItem();
  };

  isValidSentiment = () => {
    let validSentiment = false;
    let sentiment = parseFloat(this.state.sentimentText);
    if (!isNaN(sentiment) && sentiment >= -1.0 && sentiment <= 1.0) {
      validSentiment = true;
    }
    return validSentiment;
  };

  handleHeadlineChanged = async (event: React.ChangeEvent) => {
    this.setState({
      headlineText: (event.target as HTMLInputElement).value,
      itemDataChanged: true,
    });
    // we will do it in graphData
    // await this.detectTagsInHeadline()
  };

  detectTagsInHeadline = async () => {
    if (this.state.currentItem.type !== MpgItemType.Tag) {
      this.state.tags.forEach(async (tag) => {
        if (
          this.state.headlineText
            .toLowerCase()
            .includes(tag.headline.toLowerCase())
        ) {
          const currentItem = this.state.currentItem;
          await this.props.tagItemWithExistingTag(
            this.state.currentItem.id,
            tag.id
          );
          this.setState({ currentItem: currentItem });
        }
      });
    }
  };

  detectTagsInNotes = async () => {
    if (this.state.currentItem.type !== MpgItemType.Tag) {
      this.state.tags.forEach(async (tag) => {
        if (
          this.state.notesText
            .toLowerCase()
            .includes(tag.headline.toLowerCase())
        ) {
          const currentItem = this.state.currentItem;
          await this.props.tagItemWithExistingTag(
            this.state.currentItem.id,
            tag.id
          );
          this.setState({ currentItem: currentItem });
        }
      });
    }
  };

  handleNotesChanged = async (event: React.ChangeEvent) => {
    this.setState({
      notesText: (event.target as HTMLInputElement).value,
      itemDataChanged: true,
    });
    // notes can be too long to detect all tags
    // await this.detectTagsInHeadline()
  };

  handleKeyPressed = async (event: any) => {
    if (event.key === "Enter") {
      this.setState({ itemDataChanged: true });
      this.updateItem();
    }
  };

  updateItem = async () => {
    if (this.state.itemDataChanged) {
      this.state.currentItem.priority += 1;
      this.props.setDataSavingInprogress(true);
      if (this.state.overrideSentiment) {
        this.state.currentItem.overrideSentiment = true;
      }
      this.props.setDataSavingInprogress(true);
      this.setState({ dataSavingInProgress: true });
      let item = this.state.currentItem;
      item.headline = this.state.headlineText;
      item.notes = this.state.notesText;
      if (!isNaN(parseInt(this.state.priorityText))) {
        item.priority = parseInt(this.state.priorityText);
      } else {
        item.priority = 0;
      }
      if (this.isValidSentiment()) {
        item.sentiment = parseFloat(this.state.sentimentText);
      } else {
        item.sentiment = 0;
      }
      this.state.currentItem.privacy = this.state.privacy;
      await this.props.updateItem(this.state.currentItem);
      // investigate doing this only in GraphData
      await this.detectTagsInHeadline();
      await this.detectTagsInNotes();
      this.setState({
        currentItem: item,
        itemDataChanged: false,
        dataSavingInProgress: false,
        sentimentText: this.state.currentItem.sentiment.toFixed(2),
        netSentimentText: this.state.currentItem.netSentiment.toFixed(2),
        privacy: this.state.currentItem.privacy,
      });
      this.props.setDataSavingInprogress(false);
    }
  };

  setItemDataChanged = (changed: boolean) => {
    this.setState({ itemDataChanged: changed });
  };

  renderEntryHeader = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignContent: "center",
          alignItems: "center",
          margin: 5,
        }}
      >
        {this.renderLeftIcon()}
        <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            color: MpgTheme.palette.primary.contrastText,
          }}
        >
          Entry: {this.state.currentItem.getShortHeadline()}
        </Typography>
        {this.renderRightIcon()}
      </div>
    );
  };

  renderListHeader = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignContent: "center",
          alignItems: "center",
          margin: 5,
        }}
      >
        {this.renderLeftIcon()}
        <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            color: MpgTheme.palette.primary.contrastText,
          }}
        >
          List: {this.state.currentItem.getShortHeadline()}
        </Typography>
        {this.renderRightIcon()}
      </div>
    );
  };

  getEntryHeaderLabel = (): string => {
    return "Entry: " + this.state.currentItem.getShortHeadline();
  };

  renderTagHeader = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignContent: "center",
          alignItems: "center",
          margin: 5,
        }}
      >
        {this.renderLeftIcon()}
        <Typography
          variant="h6"
          style={{
            fontWeight: "bold",
            color: MpgTheme.palette.primary.contrastText,
          }}
        >
          Tag ({this.state.currentItem.headline})
        </Typography>
        {this.renderRightIcon()}
      </div>
    );
  };

  render = () => {
    // const closeButtonColor = this.state.itemDataChanged
    // ? MpgTheme.palette.background
    // : MpgTheme.palette.primary.main;
    return (
      <ThemeProvider theme={MpgTheme}>
        <div>
          <Card
            elevation={1}
            style={{
              maxWidth: this.props.viewWidth,
              minWidth: this.props.viewWidth,
              margin: this.props.viewMargin,
              marginTop: 5,
              backgroundColor: MpgTheme.palette.primary.dark,
            }}
          >
            {this.renderHeaderFun()}
            {this.renderBody()}
            <div
              style={{
                display: "flex",
                justifyContent: "space-around",
                margin: 5,
              }}
            ></div>
            {this.renderButtons()}
          </Card>
        </div>
      </ThemeProvider>
    );
  };

  renderButtons = () => {
    return this.state.itemDataChanged
      ? this.renderSaveAndClose()
      : this.renderClose();
  };

  renderSaveAndClose = () => {
    return (
      <div>
        <Button
          onClick={() => this.handleSave()}
          style={{
            margin: 5,
            color: MpgTheme.palette.primary.contrastText,
            backgroundColor: MpgTheme.palette.primary.main,
          }}
          size="small"
          // color="secondary"
        >
          Save
        </Button>
        <Button
          onClick={() => this.handleSaveAndClose()}
          style={{
            margin: 5,
            color: MpgTheme.palette.primary.contrastText,
            backgroundColor: MpgTheme.palette.primary.main,
          }}
          size="small"
          // color="secondary"
        >
          Save and close
        </Button>
        <Button
          variant="contained"
          onClick={() => this.handleItemDelete()}
          style={{
            margin: 5,
            color: MpgTheme.palette.primary.contrastText,
            backgroundColor: MpgTheme.palette.primary.main,
          }}
          size="small"
          // color="secondary"
        >
          Delete
        </Button>
      </div>
    );
  };

  renderClose = () => {
    return (
      <div>
        <Button
          onClick={() => this.handleClose()}
          style={{
            margin: 5,
            color: MpgTheme.palette.primary.contrastText,
            backgroundColor: MpgTheme.palette.primary.main,
          }}
          size="small"
          // color="secondary"
          disabled={this.state.itemDataChanged}
        >
          Close
        </Button>
        <Button
          variant="contained"
          onClick={() => this.handleItemDelete()}
          style={{
            margin: 5,
            color: MpgTheme.palette.primary.contrastText,
            backgroundColor: MpgTheme.palette.primary.main,
          }}
          size="small"
          // color="secondary"
        >
          Delete
        </Button>
      </div>
    );
  };

  refreshItem = async () => {
    const currentItem = this.state.currentItem;
    await this.setState({ currentItem: currentItem });
    this.renderActiveEntriesPanelLabel();
  };

  handleClose = () => {
    if (!this.state.itemDataChanged) {
      this.props.closeView(this.state.currentItem);
    } else {
      // do nothing
      // cannot close item if it has changed
      // use delete or save it
    }
  };

  handleSaveAndClose = async () => {
    await this.updateItem();
    this.props.closeView(this.state.currentItem);
  };

  handleSave = async () => {
    await this.updateItem();
  };

  handleItemDelete = async () => {
    this.setDataSavingInprogress(true);
    await this.props.deleteItem(this.state.currentItem);
    this.props.setDataSavingInprogress(false);
    // this.setDataSavingInprogress(false);
  };

  renderBody = () => {
    return (
      <Card
        elevation={1}
        style={{
          margin: 0,
          backgroundColor: MpgTheme.palette.primary.main,
        }}
      >
        {this.renderPanels()}
      </Card>
    );
  };

  renderLeftIcon = () => {
    let saveIconColor = this.state.itemDataChanged
      ? MpgTheme.palette.secondary.light
      : MpgTheme.palette.primary.contrastText;
    return (
      <div>
        {!this.state.dataSavingInProgress ? (
          <Tooltip title={"Close"}>
            <Icon
              onClick={() => this.handleClose()}
              style={{ fontSize: "18px", color: saveIconColor }}
            >
              close
            </Icon>
          </Tooltip>
        ) : (
          <CircularProgress color="secondary" size={25} value={50} />
        )}
      </div>
    );
  };

  renderRightIcon = () => {
    let saveIconColor = this.state.itemDataChanged
      ? MpgTheme.palette.secondary.light
      : MpgTheme.palette.primary.contrastText;
    return (
      <div>
        {!this.state.dataSavingInProgress ? (
          <Tooltip title={"Save"}>
            <Icon
              onClick={() => this.props.updateItem}
              style={{ fontSize: "18px", color: saveIconColor }}
            >
              save
            </Icon>
          </Tooltip>
        ) : (
          <CircularProgress color="secondary" size={25} value={50} />
        )}
      </div>
    );
  };

  private renderPanels = () => {
    return (
      <div>
        {this.panelList.map((panel) => {
          return (
            <div key={panel.index}>
              <MpgPanel
                index={panel.index}
                renderLabelFun={panel.renderLabelFun}
                renderDetailFun={panel.renderDetailsFun}
                initialStateOpen={panel.initialStateOpen}
                leftSideFunction={panel.leftSideFunction}
                leftSideFunctionIcon={panel.leftSideFunctionIcon}
                leftSideFunctionToolTip={panel.leftSideFunctionToolTip}
                leftSideFunctionEnabled={panel.leftSideFunctionEnabled}
              />
            </div>
          );
        })}
      </div>
    );
  };

  private renderHeadlinePanelLabel = () => {
    return "Headline and notes";
  };

  static getDerivedStateFromProps = (
    newProps: IMpgItemViewProps,
    state: IMpgItemViewState
  ) => {
    state = {
      ...state,
      items: newProps.entries,
      currentItem: newProps.currentItem,
      tags: newProps.tags,
    };
    return state;
  };
}
