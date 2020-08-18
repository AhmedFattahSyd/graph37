import React from "react";
import {
  Card,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@material-ui/core";
import MpgItem from "./MpgItem";
import MpgEntry from "./MpgEntry";
import MpgItemListCompenent from "./MpgItemListComponent";
import MpgTheme from "./MpgTheme";
import MpgTag from "./MpgTag";
import { MpgItemType } from "./MpgItemType";
import MpgList from "./MpgList";
import MpgParentRel from "./MpgParentRel";

interface ItemChildParentProps {
  currentItem: MpgItem;
  openItem: Function;
  addNewChildFromNewItem: Function;
  addChildFromExistingItem: Function;
  entries: Map<string, MpgEntry>;
  lists: Map<string,MpgList>
  tags: Map<string, MpgTag>;
  deleteItem: Function;
  updateItem: Function;
  refreshItem: Function;
  childComponent: boolean;
  addNewParentFromNewItem: Function;
  addParentFromExistingItem: Function;
  removeParentChildRel: Function
  removeTagFromItem: Function
  setDataSavingInProgress: Function
  privateMode: boolean
}

interface ItemChildParentsState {
  searchText: string;
  searchListVisible: boolean;
  existingChildRels: Map<string, MpgParentRel>;
  existingParentRels: Map<string, MpgParentRel>;
  currentItem: MpgItem;
  matchedChildren: Array<MpgItem>;
  matchedParents: Array<MpgItem>;
  childComponent: boolean;
}

export default class MpgChildParentComponent extends React.Component<
  ItemChildParentProps,
  ItemChildParentsState
> {
  readonly ADD_NEW_ITEM_ID = "ADD_NEW_CHILD_ID";

  constructor(props: ItemChildParentProps) {
    super(props);
    this.state = {
      searchText: "",
      searchListVisible: false,
      existingChildRels: props.currentItem.childRels,
      currentItem: props.currentItem,
      matchedChildren: new Array<MpgItem>(),
      matchedParents: new Array<MpgItem>(),
      existingParentRels: props.currentItem.parentRels,
      childComponent: this.props.childComponent,
    };
  }

  render = () => {
    let searchLabel = "Add or search for parent";
    if (this.state.childComponent) {
      searchLabel = "Add or search for child";
    }
    return (
      <Card style={{ textAlign: "left", margin: 5, padding: 3 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            margin: 0,
          }}
        >
          <TextField
            id="search"
            label={searchLabel}
            value={this.state.searchText}
            style={{
              marginLeft: 10,
              width: "95%",
              fontSize: 10,
              marginTop: 0,
            }}
            onChange={this.handleSearchTextChange}
            autoComplete="off"
          />
        </div>
        {this.state.childComponent
          ? this.renderMatchedChildren()
          : this.renderMatchedParents()}
        {this.state.childComponent
          ? this.renderExistingChildren()
          : this.renderExistingParents()}
      </Card>
    );
  };

  renderMatchedChildren = () => {
    return (
      <div>
        {this.state.searchListVisible ? (
          <List>
            {this.state.matchedChildren.map((entry) => (
              <ListItem
                key={entry.id}
                button
                onClick={(event) => this.handleAddNewChild(event, entry.id)}
              >
                <ListItemText
                  primary={entry.headline}
                  style={{ fontSize: 12 }}
                />
              </ListItem>
            ))}
            <Divider />
            <ListItem
              key={this.ADD_NEW_ITEM_ID}
              button
              onClick={(event) =>
                this.handleAddNewChild(event, this.ADD_NEW_ITEM_ID)
              }
            >
              <ListItemText
                primary={"Add new parent: " + this.state.searchText}
              />
            </ListItem>
          </List>
        ) : (
          <div />
        )}
      </div>
    );
  };

  renderMatchedParents = () => {
    return (
      <div>
        {this.state.searchListVisible ? (
          <List>
            {this.state.matchedParents.map((entry) => (
              <ListItem
                key={entry.id}
                button
                onClick={(event) => this.handleAddNewParent(event, entry.id)}
              >
                <ListItemText
                  primary={entry.headline}
                  style={{ fontSize: 12 }}
                />
              </ListItem>
            ))}
            <Divider />
            <ListItem
              key={this.ADD_NEW_ITEM_ID}
              button
              onClick={(event) =>
                this.handleAddNewParent(event, this.ADD_NEW_ITEM_ID)
              }
            >
              <ListItemText
                primary={"Add new parent: " + this.state.searchText}
              />
            </ListItem>
          </List>
        ) : (
          <div />
        )}
      </div>
    );
  };

  private getItemsToSearch = (): Map<string, MpgItem> => {
    switch (this.state.currentItem.type) {
      case MpgItemType.Tag:
        return this.props.tags;
      case MpgItemType.Entry:
        return this.props.entries;
      case MpgItemType.List:
        return this.props.lists;
      default:
        throw new Error(
          `MpgChildParentComponent: invalid item type:${this.state.currentItem.type}`
        );
    }
  };

  handleAddNewChild = async (event: any, childId: string) => {
    try {
      this.props.setDataSavingInProgress(true)
      if (childId === this.ADD_NEW_ITEM_ID) {
        await this.props.addNewChildFromNewItem(
          this.state.currentItem,
          this.state.searchText
        );
      } else {
        await this.props.addChildFromExistingItem(
          this.state.currentItem,
          childId
        );
      }
      await this.setState({
        searchText: "",
        searchListVisible: false,
        existingChildRels: this.state.currentItem.childRels,
      });
      this.props.setDataSavingInProgress(false)
    } catch (error) {
      throw error;
    }
  };

  handleAddNewParent = async (event: any, itemId: string) => {
    try {
      this.props.setDataSavingInProgress(true)
      if (itemId === this.ADD_NEW_ITEM_ID) {
        await this.props.addNewParentFromNewItem(
          this.state.currentItem,
          this.state.searchText
        );
      } else {
        await this.props.addParentFromExistingItem(
          this.state.currentItem,
          itemId
        );
      }
      await this.setState({
        searchText: "",
        searchListVisible: false,
        existingParentRels: this.state.currentItem.parentRels,
      });
      this.props.setDataSavingInProgress(false)
    } catch (error) {
      throw error;
    }
  };

  renderExistingChildren = () => {
    const children = new Map<string,MpgItem>()
    this.state.currentItem.childRels.forEach(parentRel=>{
      children.set(parentRel.child.id,parentRel.child)
    })
    return (
      <Card
        style={{
          backgroundColor: MpgTheme.palette.primary.light,
          margin: 5,
        }}
      >
        <MpgItemListCompenent
          items={children}
          openItem={this.props.openItem}
          deleteItem={this.props.deleteItem}
          refreshItem={this.props.refreshItem}
          updateItem={this.props.updateItem}
          removeFromListEnabled={true}
          removeFromListToolTip={"Remove this child"}
          removeFromListFun={this.handleRemoveItemFromList}
          showArchived={true}
          showActive={true}
          showParked={true}
          removeTagFromItem={this.props.removeTagFromItem}
          setDataSavingInProgress={this.props.setDataSavingInProgress}
          privateMode={this.props.privateMode}
        />
      </Card>
    );
  };

  renderExistingParents = () => {
    const parents = new Map<string,MpgItem>()
    this.state.currentItem.parentRels.forEach(parentRel=>{
      parents.set(parentRel.parent.id,parentRel.parent)
    })
    return (
      <Card
        style={{
          backgroundColor: MpgTheme.palette.primary.light,
          margin: 5,
        }}
      >
        <MpgItemListCompenent
          items={parents}
          openItem={this.props.openItem}
          deleteItem={this.props.deleteItem}
          refreshItem={this.props.refreshItem}
          updateItem={this.props.updateItem}
          removeFromListEnabled={true}
          removeFromListToolTip={"Remove this parent"}
          removeFromListFun={this.handleRemoveItemFromList}
          showArchived={true}
          removeTagFromItem={this.props.removeTagFromItem}
          showParked={true}
          showActive={true}
          setDataSavingInProgress={this.props.setDataSavingInProgress}
          privateMode={this.props.privateMode}
        />
      </Card>
    );
  };

  handleRemoveItemFromList = async(item: MpgItem)=>{
    this.props.setDataSavingInProgress(true)
    if(this.state.childComponent){
      await this.handleRemoveChild(item)
    }else{
      await this.handleRemoveParent(item)
    }
    this.props.setDataSavingInProgress(true)
  }

  handleRemoveChild = async(item: MpgItem)=>{
       // find the corresponding parentRel
       this.state.existingChildRels.forEach(async(parentRel)=>{
        // find the rel with this item as a parent
        if(parentRel.item2.id === item.id){
          await this.props.removeParentChildRel(parentRel)
        }
      })
  }

  handleRemoveParent = async(item: MpgItem)=>{
    // find the corresponding parentRel
    this.state.existingParentRels.forEach(async(parentRel)=>{
      // find the rel with this item as a child
      if(parentRel.item1.id === item.id){
        await this.props.removeParentChildRel(parentRel)
      }
    })
  }

  static getDerivedStateFromProps = (
    newProps: ItemChildParentProps,
    state: ItemChildParentsState
  ) => {
    state = {
      ...state,
      currentItem: newProps.currentItem,
      existingChildRels: newProps.currentItem.childRels,
      existingParentRels: newProps.currentItem.parentRels,
    };
    return state;
  };

  handleRemoveChildFromItem = (item: MpgItem) => {
    // this.props.removeChildFromItem(this.state.currentItem, item);
    // const currentItem = this.state.currentItem;
    // const existingChildMap = currentItem.children;
    // this.setState({
    //   currentItem: currentItem,
    //   existingChildMap: existingChildMap,
    // });
  };

  handleSearchTextChange = async (event: React.ChangeEvent) => {
    const entrySearchText = (event.target as HTMLInputElement).value;
    if (entrySearchText.length > 0) {
      this.setState({
        searchText: entrySearchText,
        searchListVisible: true,
      });
      await this.setMatchedItems(entrySearchText);
    } else {
      this.setState({
        searchText: entrySearchText,
        searchListVisible: false,
      });
    }
  };

  setMatchedItems = async (text: string) => {
    try {
      const items = this.getItemsToSearch();
      const ancestors = this.state.currentItem.getAncestors();
      const descendents = this.state.currentItem.getDescendents();
      const itemsToSearch = Array.from(items.values()).filter((item) => {
        return !(
          ancestors.has(item.id) ||
          descendents.has(item.id) ||
          item.id === this.state.currentItem.id
        );
      });

      const foundItemList = itemsToSearch.filter((item) => {
        return item.headline.toLowerCase().includes(text.toLowerCase());
      });
      if (this.state.childComponent) {
        this.setState({ matchedChildren: foundItemList });
      } else {
        this.setState({ matchedParents: foundItemList });
      }

      // });
    } catch (error) {
      throw error;
    }
  };
}
