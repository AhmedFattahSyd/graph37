import React from "react";
import {
  AppBar,
  Toolbar,
  Icon,
  Typography,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  SnackbarContent,
  IconButton,
  SwipeableDrawer,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@material-ui/core";
import MpgTheme from "./MpgTheme";
import MpgGraphData, { MessageType, MpgTimelineRange } from "./MpgGraphData";
import MpgUser from "./MpgUser";
import MpgItem from "./MpgItem";
import MpgViewableItem from "./MpgViewableItem";
import MpgViewableItemView from "./MpgViewableItemView";
import MpgItemView from "./MpgItemView";
import { MpgItemType } from "./MpgItemType";
import MpgTag from "./MpgTag";
import MpgEntry from "./MpgEntry";
import MpgList from "./MpgList";
import MpgRel from "./MpgRel";
import MpgGraphicalView from "./MpgGraphicalView";

interface MpgAppProps {}

interface MpgAppState {
  appErrorState: boolean;
  appError: Error | null;
  sidebarVisible: boolean;
  userSignedIn: boolean;
  modalDialogOpen: boolean;
  currentUser: MpgUser | null;
  quickAddItemDialogOpen: boolean;
  headlineText: string;
  messageVisible: boolean;
  message: string;
  messageWaitTime: number;
  messageType: MessageType;
  entries: Map<string, MpgEntry>;
  openItems: Map<string, MpgViewableItem>;
  deleteWarningMessage: string;
  itemToBeDeleted: MpgItem | null;
  deleteWarningDialogOpen: boolean;
  matchedEntries: Map<string, MpgEntry>;
  matchedTags: Map<string, MpgTag>;
  searchText: string;
  tags: Map<string, MpgTag>;
  items: Map<string, MpgItem>;
  lists: Map<string, MpgList>;
  matchedLists: Map<string, MpgList>;
  initialLoadInProgress: boolean;
  dataLoading: boolean;
  itemsLoaded: number;
  relsLoaded: number;
  rels: Map<string, MpgRel>;
  dataSavingInprogress: boolean;
  dateEntryMap: Map<number, Map<string, MpgEntry>>;
  earlistEntryDate: number;
}

export default class MpgApp extends React.Component<MpgAppProps, MpgAppState> {
  private graphData: MpgGraphData;
  readonly maxViewWidth = 410;
  private viewWidth: number = this.maxViewWidth;
  private displayWidth: number = 3000;
  private maxDisplayWidth = 10000;
  private viewMargin = 5;
  private startTime: number = 0;
  private appVersion = "My Graph - Version: Alpha (37.071) - 18 August 2020";
  private privateMode = true
  constructor(props: MpgAppProps) {
    super(props);

    this.state = {
      appErrorState: false,
      appError: null,
      sidebarVisible: false,
      userSignedIn: false,
      modalDialogOpen: true,
      currentUser: null,
      quickAddItemDialogOpen: false,
      headlineText: "",
      message: "",
      messageVisible: false,
      messageWaitTime: 6000,
      messageType: MessageType.Information,
      entries: new Map(),
      openItems: new Map(),
      deleteWarningMessage: "",
      itemToBeDeleted: null,
      deleteWarningDialogOpen: false,
      matchedEntries: new Map(),
      matchedTags: new Map(),
      matchedLists: new Map(),
      searchText: "",
      tags: new Map(),
      items: new Map(),
      lists: new Map(),
      initialLoadInProgress: false,
      dataLoading: true,
      itemsLoaded: 0,
      relsLoaded: 0,
      rels: new Map(),
      dataSavingInprogress: false,
      earlistEntryDate: 0,
      dateEntryMap: new Map(),
    };
    this.graphData = new MpgGraphData(this.state.currentUser, this.refreshData);
  }

  setPrivateModeOn = ()=>{
    this.privateMode=true
  }

  setPrivateModeOff = ()=>{
    this.privateMode=false
  }

  showAppVersion = () => {
    this.showMessage(this.appVersion, MessageType.Information, 60000);
  };

  signoutUser = async () => {
    await this.closeAllViews();
    await this.graphData.signOutUser();
  };

  exportData = () => {
    this.graphData.exportData();
  };

  refreshData = async (
    user: MpgUser,
    entries: Map<string, MpgEntry>,
    tags: Map<string, MpgTag>,
    items: Map<string, MpgItem>,
    lists: Map<string, MpgList>,
    initialLoadInProgress: boolean,
    itemsLoaded: number,
    relsLoaded: number,
    rels: Map<string, MpgRel>,
    earlistEntryDate: number,
    dateEntryMap: Map<number, Map<string, MpgEntry>>
  ) => {
    let userSignedIn = false;
    if (user !== null) {
      if (user.userSignedOn) {
        userSignedIn = true;
      }
    }
    await this.setState({
      currentUser: user,
      userSignedIn: userSignedIn,
      entries: entries,
      tags: tags,
      items: items,
      lists: lists,
      initialLoadInProgress: initialLoadInProgress,
      itemsLoaded: itemsLoaded,
      relsLoaded: relsLoaded,
      rels: rels,
      earlistEntryDate: earlistEntryDate,
      dateEntryMap: dateEntryMap,
    });
    // console.log("relsLoadedd (refreshData):", relsLoaded);
    if (this.state.dataLoading) {
      if (!this.state.initialLoadInProgress) {
        await this.setState({ dataLoading: false });
        const dataLoadingTime = Math.floor(
          (new Date().getTime() - this.startTime) / 1000
        );
        this.showMessage(
          `Data has been loaded. Elapsed time: ${dataLoadingTime} sec.
           items: ${this.state.itemsLoaded}, relations:${this.state.relsLoaded}`,
          MessageType.Information,
          60000
        );
        // this.openSerachView();
        this.openTimelineView();
      } else {
        // initial load is still in progress
        this.showMessage(
          `Loading data ... items loaded: ${this.state.itemsLoaded}, relations loaded: ${this.state.relsLoaded}`,
          MessageType.Information,
          60000
        );
      }
    } else {
    }
    this.refreshMatchedItems();
    this.refreshAllOpenItems();
  };

  addParentFromExistingItem = async (item: MpgItem, parentId: string) => {
    this.graphData.addParentFromExistingItem(item, parentId);
    this.refreshAllOpenItems();
  };

  updateSize = () => {
    if (window.innerWidth < this.maxViewWidth) {
      this.viewWidth = window.innerWidth;
      this.viewMargin = 0;
      this.displayWidth = window.innerWidth;
    } else {
      this.viewWidth = this.maxViewWidth;
      this.displayWidth = this.maxDisplayWidth;
    }
  };

  renderDrawer = () => {
    return (
      <SwipeableDrawer
        open={this.state.sidebarVisible}
        onClose={this.toggleDrawer(false)}
        onOpen={this.toggleDrawer(true)}
        color="#DCDCDC"
      >
        <div
          tabIndex={0}
          role="button"
          onClick={this.toggleDrawer(false)}
          onKeyDown={this.toggleDrawer(false)}
        >
          {this.renderMenuItems()}
        </div>
      </SwipeableDrawer>
    );
  };

  renderMenuItems = () => {
    return (
      <div>
        <Divider />
        <List style={{ width: "300px" }}>
          <ListItem button onClick={this.createABlankListAndOpenIt}>
            <ListItemText primary="New list" />
          </ListItem>
          <ListItem button onClick={this.createABlankEntryAndOpenIt}>
            <ListItemText primary="New entry" />
          </ListItem>
          <ListItem button onClick={this.createABlankTagAndOpenIt}>
            <ListItemText primary="New tag" />
          </ListItem>
          <Divider />
          <ListItem button onClick={this.openSerachView}>
            <ListItemText primary="Search" />
          </ListItem>
          <ListItem button onClick={this.openTimelineView}>
            <ListItemText primary="Timeline" />
          </ListItem>
          <ListItem button onClick={this.openContextView}>
            <ListItemText primary="Context" />
          </ListItem>
          <ListItem button onClick={this.openTagListView}>
            <ListItemText primary="Tag List" />
          </ListItem>
          <ListItem button onClick={this.openInboxView}>
            <ListItemText primary="Inbox" />
          </ListItem>
          <ListItem button onClick={this.openGraphicalView}>
            <ListItemText primary="Open graphical view" />
          </ListItem>
          <Divider />
          <ListItem button onClick={this.signinUser}>
            <ListItemText primary="Signin" />
          </ListItem>
          <ListItem button onClick={this.signoutUser}>
            <ListItemText primary="Sign out" />
          </ListItem>
          <Divider />
          <ListItem button onClick={this.exportData}>
            <ListItemText primary="Export data" />
          </ListItem>
          <ListItem button onClick={this.openImportView}>
            <ListItemText primary="Import data" />
          </ListItem>
          <Divider />
          <ListItem button onClick={this.setPrivateModeOn}>
            <ListItemText primary="Set private mode on" />
          </ListItem>
          <ListItem button onClick={this.setPrivateModeOff}>
            <ListItemText primary="Set private mode off" />
          </ListItem>
          <Divider />
          <ListItem button onClick={this.showAppVersion}>
            <ListItemText primary="App version" />
          </ListItem>
        </List>
        <Divider />
      </div>
    );
  };

  signinUser = async () => {
    this.startTime = new Date().getTime();
    this.graphData.signinUser();
  };

  openItem = (item: MpgItem) => {
    if (!this.state.openItems.has(item.id)) {
      const openItems = this.state.openItems;
      openItems.set(item.id, item);
      this.setState({ openItems: openItems });
    }
  };

  openSerachView = () => {
    const searchItem = new MpgViewableItem(
      MpgItemType.Search,
      "Search",
      "Search"
    );
    const openItems = this.state.openItems;
    openItems.set(searchItem.id, searchItem);
    this.setState({ openItems: openItems });
  };

  openImportView = () => {
    this.graphData.importDataFromGoogleStorage();
    // const importItem = new MpgViewableItem(
    //   MpgItemType.Import,
    //   "Import",
    //   "Import"
    // );
    // const openItems = this.state.openItems;
    // openItems.set(importItem.id, importItem);
    // this.setState({ openItems: openItems });
  };

  openContextView = () => {
    const contextItem = new MpgViewableItem(
      MpgItemType.Context,
      "Context",
      "Context"
    );
    const openItems = this.state.openItems;
    openItems.set(contextItem.id, contextItem);
    this.setState({ openItems: openItems });
  };

  openGraphicalView = () => {
    const grapgicalView = new MpgViewableItem(
      MpgItemType.GraphicalView,
      "Graphical view",
      "Graphical view"
    );
    const openItems = this.state.openItems;
    openItems.set(grapgicalView.id, grapgicalView);
    this.setState({ openItems: openItems });
  };

  openTimelineView = () => {
    const timelineItem = new MpgViewableItem(
      MpgItemType.Timeline,
      "Timeline",
      "Timeline"
    );
    const openItems = this.state.openItems;
    openItems.set(timelineItem.id, timelineItem);
    this.setState({ openItems: openItems });
  };

  openTagListView = () => {
    const tagListItem = new MpgViewableItem(
      MpgItemType.TagList,
      "TagList",
      "TagList"
    );
    const openItems = this.state.openItems;
    openItems.set(tagListItem.id, tagListItem);
    this.setState({ openItems: openItems });
  };

  openInboxView = () => {
    const inboxItem = new MpgViewableItem(MpgItemType.Inbox, "Inox", "Inbox");
    const openItems = this.state.openItems;
    openItems.set(inboxItem.id, inboxItem);
    this.setState({ openItems: openItems });
  };

  functionNotImplementedYet = () => {
    this.showMessage(`Sorry, function has not been implemented yet`);
  };

  render = () => {
    return (
      <div>
        {this.state.appErrorState
          ? this.renderAppError()
          : this.renderNormalApp()}
      </div>
    );
  };

  renderAppError = () => {
    return (
      <div>
        <h1>Error</h1>
        <p>{this.state.appError};</p>
      </div>
    );
  };

  renderNormalApp = () => {
    return (
      <div
        style={{
          width: this.displayWidth,
          height: "100%",
        }}
      >
        <div>
          {this.renderAppBar()}
          <div style={{ paddingTop: 60 }}> </div>
          <div
            style={{
              paddingTop: 5,
              display: "flex",
              justifyContent: "flex-start",
              flexWrap: "wrap",
              textAlign: "center",
              width: this.displayWidth,
              alignItems: "flex-start",
              alignContent: "flex-start",
            }}
          >
            {Array.from(this.state.openItems.values()).map((item) => (
              <div key={item.id}>{this.renderViewableItemComponent(item)}</div>
            ))}
          </div>
          {this.renderDrawer()}
          {this.renderMessage()}
          {/* {this.renderProgress()} */}
        </div>
      </div>
    );
  };

  tagItemWithNewTag = async (taggedItemId: string, newTagHeadline: string) => {
    await this.graphData.tagItemWithNewTag(taggedItemId, newTagHeadline);
    this.refreshAllOpenItems();
  };

  public tagItemWithExistingTag = async (
    taggedItemId: string,
    tagId: string
  ) => {
    try {
      await this.graphData.tagItemWithExistingTag(taggedItemId, tagId);
      this.refreshAllOpenItems();
    } catch (error) {
      throw error;
    }
  };

  addNewChildFromNewItem = async (item: MpgItem, newItemHeadline: string) => {
    await this.graphData.addNewChildFromNewItem(item, newItemHeadline);
    this.refreshAllOpenItems();
  };

  addChildFromExistingItem = async (item: MpgItem, childId: string) => {
    await this.graphData.addChildFromExistingItem(item, childId);
    this.refreshAllOpenItems();
  };

  renderViewableItemComponent = (item: MpgViewableItem) => {
    switch (item.type) {
      case MpgItemType.Search:
      case MpgItemType.Timeline:
      case MpgItemType.TagList:
      case MpgItemType.Inbox:
      case MpgItemType.Context:
      case MpgItemType.Import:
        return this.renderViewableItemViewComponent(item);
      case MpgItemType.Entry:
        return this.renderItemComponent(item as MpgEntry);
      case MpgItemType.Tag:
        return this.renderItemComponent(item as MpgTag);
      case MpgItemType.List:
        return this.renderItemComponent(item as MpgList);
      case MpgItemType.GraphicalView:
        return this.renderGraphicalView(item);
      default:
        throw new Error(`MpgApp: invalid ViewableItem type: ${item.type}`);
    }
  };

  processImportedData = (importedData: string) => {
    this.graphData.processImportData(importedData);
  };

  public updateItem = async (item: MpgItem) => {
    try {
      await this.graphData.updateItem(item);
      this.refreshAllOpenItems();
    } catch (error) {
      throw error;
    }
  };

  public updateUser = async (user: MpgUser) => {
    try {
      // await this.graphData.UpdateUserDoc(user);
      this.refreshAllOpenItems();
    } catch (error) {
      throw error;
    }
  };

  refreshAllOpenItems = () => {
    this.state.openItems.forEach((item) => {
      this.refreshOpenItem(item);
    });
  };

  refreshOpenItem = (item: MpgViewableItem) => {
    const openItems = this.state.openItems;
    if (
      item.type === MpgItemType.Entry ||
      item.type === MpgItemType.Tag ||
      item.type === MpgItemType.List
    ) {
      let openItem = this.state.items.get(item.id);
      if (openItem !== undefined) {
        openItems.set(item.id, openItem);
      } else {
        this.state.openItems.delete(item.id);
      }
    }
    this.setState({ openItems: openItems });
  };

  closeView = (item: MpgViewableItem) => {
    const openItems = this.state.openItems;
    openItems.delete(item.id);
    this.setState({ openItems: openItems });
    this.refreshAllOpenItems();
  };

  closeAllViews = () => {
    let openItems = this.state.openItems;
    openItems.forEach((item) => {
      this.closeView(item);
    });
    openItems = new Map();
    this.setState({ openItems: openItems });
  };

  renderViewableItemViewComponent = (item: MpgViewableItem) => {
    return (
      <div>
        <MpgViewableItemView
          currentItem={item}
          viewWidth={this.viewWidth}
          closeView={this.closeView}
          openItem={this.openItem}
          setMatchedEntries={this.setMatchedItems}
          matchedEntries={this.state.matchedEntries}
          matchedTags={this.state.matchedTags}
          matchedLists={this.state.matchedLists}
          deleteItem={this.deleteItem}
          updateItem={this.updateItem}
          viewMargin={this.viewMargin}
          entries={this.state.entries}
          tags={this.state.tags}
          removeTagFromItem={this.removeTagFromItem}
          currentUser={this.state.currentUser}
          updateUser={this.updateUser}
          processImportedData={this.processImportedData}
          setDataSavingInProgress={this.setDataSavingInProgress}
          earlistEntryDate={this.state.earlistEntryDate}
          dateEntryMap={this.state.dateEntryMap}
          updateTimelineRange={this.updateTimelineRange}
          privateMode={this.privateMode}
        />
      </div>
    );
  };

  renderGraphicalView = (item: MpgViewableItem) => {
    return (
      <MpgGraphicalView
        tags={this.state.tags}
        entries={this.state.entries}
        lists={this.state.lists}
        currentItem={item}
        closeView={this.closeView}
        earlistEntryDate={this.state.earlistEntryDate}
        dateEntryMap={this.state.dateEntryMap}
      />
    );
  };

  updateTimelineRange = async (timelineRange: MpgTimelineRange) => {
    await this.graphData.updateTimelineRange(timelineRange);
    console.log(
      "UpdateTimelineRange: timelineRange:",
      timelineRange,
      "dateEntryMap:",
      this.state.dateEntryMap
    );
    this.refreshAllOpenItems();
  };

  removeParentChildRel = async (parentRel: MpgRel) => {
    await this.graphData.removeParentAndChildOfParentRel(parentRel);
    this.refreshAllOpenItems();
  };

  getExistingEntries = (item: MpgItem) => {
    const entries = new Map<string, MpgEntry>();
    this.state.entries.forEach((entry) => {
      if (entry.hasAllTags(item.tagRels)) {
        entries.set(entry.id, entry);
      }
    });
    return entries;
  };

  renderItemComponent = (item: MpgItem) => {
    // this.graphData.populateEntriesWithAllTagsForAllItems();
    return (
      <div key={item.id}>
        <MpgItemView
          currentItem={item}
          entries={this.state.entries}
          openItem={this.openItem}
          viewWidth={this.viewWidth}
          closeView={this.closeView}
          updateItem={this.updateItem}
          deleteItem={this.deleteItem}
          tagItemWithNewTag={this.tagItemWithNewTag}
          tagItemWithExistingTag={this.tagItemWithExistingTag}
          removeTagFromItem={this.removeTagFromItem}
          addNewEntryToEntriesOfEntry={this.addNewEntryToEntriesOfEntry}
          addExistingEntryToEntriesOfEntry={
            this.addExistingEntryToEntriesOfEntry
          }
          tags={this.state.tags}
          addNewChildFromNewItem={this.addNewChildFromNewItem}
          addChildFromExistingItem={this.addChildFromExistingItem}
          addNewParentFromNewItem={this.addNewParentFromNewItem}
          addParentFromExistingItem={this.addParentFromExistingItem}
          lists={this.state.lists}
          removeParentChildRel={this.removeParentChildRel}
          removeEntryFromItem={this.removeEntryFromItem}
          viewMargin={this.viewMargin}
          setDataSavingInprogress={this.setDataSavingInProgress}
          // existingEntries={this.state.existingEntries}
          privateMode={this.privateMode}
        />
      </div>
    );
  };

  addNewParentFromNewItem = async (item: MpgItem, newItemHeadline: string) => {
    this.graphData.addNewParentFromNewItem(item, newItemHeadline);
    this.refreshAllOpenItems();
  };

  setMatchedItems = (searchText: string) => {
    this.setState({
      matchedEntries: this.graphData.getMatchedEntries(searchText),
      matchedTags: this.graphData.getMatchedTags(searchText),
      matchedLists: this.graphData.getMatchedLists(searchText),
      searchText: searchText,
    });
  };

  refreshMatchedItems = () => {
    this.setMatchedItems(this.state.searchText);
  };

  removeEntryFromItem = async (mainEntry: MpgItem, entryToRemove: MpgItem) => {
    await this.graphData.removeEntryFromItem(mainEntry, entryToRemove);
    this.refreshAllOpenItems();
  };

  addExistingEntryToEntriesOfEntry = async (
    mainEntryId: string,
    entryToAdd: string
  ) => {
    this.graphData.addExistingEntryToEntriesOfItem(mainEntryId, entryToAdd);
    this.refreshAllOpenItems();
  };

  addNewEntryToEntriesOfEntry = async (
    mainEntryId: string,
    newEntryHeadline: string
  ) => {
    await this.graphData.addNewEntryToEntriesOfItem(
      mainEntryId,
      newEntryHeadline
    );
    this.refreshAllOpenItems();
  };

  public removeTagFromItem = async (item: MpgItem, tagItemId: string) => {
    await this.graphData.removeTagFromItem(item, tagItemId);
    this.refreshAllOpenItems();
  };

  // deleteItemToBeDeleted = async () => {
  //   try {
  //     if (this.state.itemToBeDeleted !== null) {
  //       await this.graphData.deleteItem(this.state.itemToBeDeleted);
  //       this.setMatchedItems(this.state.searchText);
  //       this.setState({ deleteWarningDialogOpen: false });
  //       this.refreshAllOpenItems();
  //     } else {
  //       throw new Error(
  //         `MpgApp: deleteItemToBeDeleted: itemToBeDeleted is null`
  //       );
  //     }
  //   } catch (error) {
  //     throw error;
  //   }
  // };

  // deleteItem = (item: MpgItem) => {
  //   this.setState({
  //     itemToBeDeleted: item,
  //     deleteWarningMessage:
  //       "Do you really want to delete item: " + item.headline,
  //     deleteWarningDialogOpen: true,
  //   });
  // };

  deleteItem = async (item: MpgItem) => {
    await this.graphData.deleteItem(item);
    this.refreshAllOpenItems();
  };

  // renderProgress = () => {
  //   return (
  //     <div style={{ top: "50%", left: "50%", display: "fixed" }}>
  //       {this.state.dataLoading ? (
  //         // <CircularProgress color="primary" />
  //         <LinearProgress color="secondary" />
  //       ) : (
  //         <div></div>
  //       )}
  //     </div>
  //   );
  // };

  renderMessage() {
    const backgroundColor =
      this.state.messageType === MessageType.Information
        ? MpgTheme.palette.primary.dark
        : "red";
    return (
      <div style={{ display: "flex" }}>
        <Snackbar
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          open={this.state.messageVisible}
          autoHideDuration={this.state.messageWaitTime}
          onClose={this.handleCloseMessage}
          ContentProps={{
            "aria-describedby": "message-id",
          }}
        >
          <SnackbarContent
            style={{
              backgroundColor: backgroundColor,
              color: MpgTheme.palette.primary.contrastText,
            }}
            message={<span id="message-id">{this.state.message}</span>}
            action={[
              <Button
                key="undo"
                color="inherit"
                size="small"
                onClick={this.handleCloseMessage}
              >
                Close
              </Button>,
              <IconButton
                key="close"
                aria-label="Close"
                color="inherit"
                onClick={this.handleCloseMessage}
              ></IconButton>,
            ]}
          />
        </Snackbar>
      </div>
    );
  }

  handleCloseMessage = () => {
    this.setState({ messageVisible: false });
  };

  setDataSavingInProgress = (dataSavingInrpgress: boolean) => {
    this.setState({ dataSavingInprogress: dataSavingInrpgress });
  };

  renderAppBar = () => {
    return (
      <div>
        <AppBar position="fixed">
          <Toolbar
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              alignContent: "center",
              backgroundColor: MpgTheme.palette.primary.dark,
            }}
          >
            <div>
              {this.state.initialLoadInProgress ||
              this.state.dataSavingInprogress ? (
                <CircularProgress color="secondary" size={25} value={50} />
              ) : (
                <Icon
                  style={{ margin: "5px" }}
                  onClick={this.toggleDrawer(true)}
                >
                  menu
                </Icon>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center" }}>
              <Typography variant="body1">
                {this.getCurrentUserName() + "  "}
              </Typography>
              <div style={{ width: "10px" }}></div>
              <Typography variant="h5" style={{ fontWeight: "bold" }}>
                My Graph
              </Typography>
              <div style={{ width: "10px" }}></div>
              <Typography variant="body1">
                {"  " + this.state.items.size + " items"}
              </Typography>
              {/* <div style={{width:3}}></div>
              <Typography variant="body1">
                {"  " + this.state.rels.size + " rels"}
              </Typography> */}
            </div>
            {this.state.initialLoadInProgress ||
            this.state.dataSavingInprogress ? (
              <CircularProgress color="secondary" size={25} value={50} />
            ) : (
              <Tooltip title="New entry">
                <Icon
                  style={{ margin: "5px" }}
                  onClick={this.createABlankEntryAndOpenIt}
                >
                  add
                </Icon>
              </Tooltip>
            )}
          </Toolbar>
        </AppBar>
      </div>
    );
  };

  createABlankEntryAndOpenIt = async () => {
    try {
      const newEntryId = await this.graphData.createNewItem(
        MpgItemType.Entry,
        "New entry"
      );
      if (newEntryId !== undefined) {
        const item = this.state.entries.get(newEntryId);
        if (item !== undefined) {
          this.openItem(item);
        } else {
          throw new Error(`MpgApp: createABlankEntry: entry was not found`);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  createABlankListAndOpenIt = async () => {
    try {
      const newListId = await this.graphData.createNewItem(
        MpgItemType.List,
        "New list"
      );
      if (newListId !== undefined) {
        const item = this.state.lists.get(newListId);
        if (item !== undefined) {
          this.openItem(item);
        } else {
          throw new Error(`MpgApp: createABlankList: list was not found`);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  createABlankTagAndOpenIt = async () => {
    try {
      const newTagId = await this.graphData.createNewItem(
        MpgItemType.Tag,
        "New tag"
      );
      if (newTagId !== undefined) {
        const item = this.state.tags.get(newTagId);
        if (item !== undefined) {
          this.openItem(item);
        } else {
          throw new Error(`MpgApp: createABlankTag: entry was not found`);
        }
      }
    } catch (error) {
      throw error;
    }
  };

  toggleDrawer = (open: boolean) => () => {
    this.setState({
      sidebarVisible: open,
    });
  };

  renderNoUserSignedDialog = () => {
    return (
      <div>
        <Dialog open={!this.state.userSignedIn}>
          <DialogTitle id="simple-dialog-title">Dialog</DialogTitle>
          <DialogContentText id="alert-dialog-description">
            Please log on
          </DialogContentText>
          <DialogActions>
            <Button onClick={this.graphData?.signinUser}>Sign in</Button>
          </DialogActions>
        </Dialog>
      </div>
    );
  };

  // renderDeleteWarning = () => {
  //   return (
  //     <div>
  //       <Dialog open={this.state.deleteWarningDialogOpen}>
  //         <DialogTitle id="simple-dialog-title">Warning</DialogTitle>
  //         <DialogContentText id="alert-dialog-description">
  //           {this.state.deleteWarningMessage}
  //         </DialogContentText>
  //         <DialogActions>
  //           <Button onClick={this.closeDeleteWarningDialog}>Cancel</Button>
  //           <Button onClick={this.deleteItemToBeDeleted}>Delete</Button>
  //         </DialogActions>
  //       </Dialog>
  //     </div>
  //   );
  // };

  closeDeleteWarningDialog = () => {
    this.setState({ deleteWarningDialogOpen: false });
  };

  private showMessage = (
    message: string,
    messageType: MessageType = MessageType.Information,
    messageWaitTime: number = 7000
  ) => {
    if (messageType === MessageType.Error) {
      messageWaitTime = 900000;
    }
    this.setState({
      messageVisible: true,
      message: message,
      messageWaitTime: messageWaitTime,
      messageType: messageType,
    });
  };

  handleHeadlineChanged = async (event: React.ChangeEvent) => {
    this.setState({
      headlineText: (event.target as HTMLInputElement).value,
    });
  };

  componentDidMount = async () => {
    this.updateSize();
    await this.graphData.initialise();
    if (this.state.dataLoading) {
      this.showMessage("Loading data ... please wait");
      this.startTime = new Date().getTime();
    } else {
      this.openSerachView();
    }
  };

  getCurrentUserName = (): string => {
    let userName = "No user";
    if (this.state.currentUser !== null) {
      if (this.state.currentUser.userSignedOn) {
        if (this.state.currentUser.headline !== null) {
          userName = this.state.currentUser.headline;
        }
      }
    }
    return userName;
  };
}
