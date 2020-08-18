import React from "react";
import {
  Card,
  TextField,
  List,
  ListItem,
  ListItemText,
  Divider,
  ThemeProvider,
  withTheme,
  Chip,
} from "@material-ui/core";
import MpgItem from "./MpgItem";
import MpgTheme from "./MpgTheme";
import MpgTag from "./MpgTag";
import MpgTagRel from "./MpgTagRel";

interface IMpgTagsComponentProps {
  items: Map<string, MpgItem>;
  currentItem: MpgItem;
  openItem: Function;
  tagItemWithNewTag: Function;
  tagItemWithExistingTag: Function;
  removeTagFromItem: Function;
  tags: Map<string, MpgTag>;
  // setItemDataChanged: Function
  setDataSavingInprogress: Function
}
interface IMpgTagsCompenentState {
  items: Map<string, MpgItem>;
  tagSearchText: string;
  tagListVisible: boolean;
  currentItem: MpgItem;
  matchedTags: Map<string, MpgItem>;
  existingTagRels: Map<string, MpgTagRel>;
  tags: Map<string, MpgTag>;
}
class MpgTagsComponent extends React.Component<
  IMpgTagsComponentProps,
  IMpgTagsCompenentState
> {
  readonly ADD_NEW_TAG_ID = "ADD_NEW_TAG_ID";
  constructor(props: IMpgTagsComponentProps) {
    super(props);
    this.state = {
      tagSearchText: "",
      tagListVisible: false,
      items: props.items,
      currentItem: props.currentItem,
      matchedTags: new Map(),
      existingTagRels: this.props.currentItem.tagRels,
      tags: props.tags,
    };
  }
  render = () => {
    return (
      <ThemeProvider theme={MpgTheme}>
        <Card
          elevation={1}
          style={{
            textAlign: "left",
            margin: 5,
            paddingRight: 2,
            paddingLeft: 2,
            paddingTop: 0,
            paddingBottom: 0,
            //   width: "100%"
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-start",
              margin: 0,
            }}
          >
            <TextField
              id="tag"
              label="Add or search for tags"
              value={this.state.tagSearchText}
              margin="normal"
              style={{ marginLeft: 10, width: "50%", fontSize: 12 }}
              onChange={this.handleTagSearchTextChange}
              autoComplete="off"
            />
            {this.renderMatchedTagList()}
            {this.renderTags()}
          </div>
        </Card>
      </ThemeProvider>
    );
  };

  handleTagClicked = (event: any, tag: MpgItem) => {
    this.props.openItem(tag);
  };

  handleRemoveTag = async (event: any, id: string) => {
    await this.props.removeTagFromItem(this.state.currentItem, id);
  };

  renderTags = () => {
    const tags = new Array<MpgItem>();
    this.state.currentItem.tagRels.forEach((tagRel) => {
      tags.push(tagRel.tag);
    });
    return (
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        {tags.map((tag) => (
          <Chip
            key={tag.id}
            label={tag.headline}
            color="primary"
            onDelete={(event) => this.handleRemoveTag(event, tag.id)}
            onClick={(event) => this.handleTagClicked(event, tag)}
            variant="outlined"
            style={{
              margin: "5px",
              // color: MpgTheme.palette.primary.dark,
              // backgroundColor: MpgTheme.palette.primary.contrastText,
              fontWeight: "bold",
            }}
          />
        ))}
      </div>
    );
  };

  renderMatchedTagList = () => {
    return (
      <div>
        {this.state.tagListVisible ? (
          <List>
            {Array.from(this.state.matchedTags.values()).map((tag) => (
              <ListItem
                key={tag.id}
                button
                onClick={(event) => this.handleAddNewTag(event, tag.id)}
              >
                <ListItemText primary={tag.headline} style={{ fontSize: 12 }} />
              </ListItem>
            ))}
            <Divider />
            <ListItem
              key={this.ADD_NEW_TAG_ID}
              button
              onClick={(event) =>
                this.handleAddNewTag(event, this.ADD_NEW_TAG_ID)
              }
            >
              <ListItemText
                primary={"Add new tag: " + this.state.tagSearchText}
              />
            </ListItem>
          </List>
        ) : (
          <div />
        )}
      </div>
    );
  };

  handleAddNewTag = async (event: any, id: string) => {
    try {
      this.props.setDataSavingInprogress(true)
      if (id === this.ADD_NEW_TAG_ID) {
        await this.props.tagItemWithNewTag(
          this.state.currentItem.id,
          this.state.tagSearchText
        );
      } else {
        await this.props.tagItemWithExistingTag(this.state.currentItem.id, id);
      }
      this.setState({
        tagSearchText: "",
        tagListVisible: false,
      });
      this.props.setDataSavingInprogress(false)
      //   this.props.itemDataChanged(false);
    } catch (error) {
      throw error;
    }
  };

  handleTagSearchTextChange = async (event: React.ChangeEvent) => {
    const tagSearchText = (event.target as HTMLInputElement).value;
    if (tagSearchText.length > 2) {
      await this.setState({
        tagSearchText: tagSearchText,
        tagListVisible: true,
      });
      await this.setMatchedITags(tagSearchText);
    } else {
      await this.setState({
        tagSearchText: tagSearchText,
        tagListVisible: false,
      });
    }
  };

  isExistingTag = (tag: MpgTag): boolean => {
    let existingTag = false;
    this.state.existingTagRels.forEach((tagRel) => {
      if (tagRel.item2.id === tag.id) {
        existingTag = true;
        return existingTag;
      }
    });
    return existingTag;
  };

  setMatchedITags = async (text: string) => {
    try {
      let foundTags: Map<string, MpgItem> = new Map();
      const tagsToSearch = Array.from(this.state.tags.values()).filter(
        (tag) => {
          return !this.isExistingTag(tag);
        }
      );
      // should use filter
      tagsToSearch.forEach((tag) => {
        if (tag.headline.toLowerCase().includes(text.toLowerCase())) {
          foundTags.set(tag.id, tag);
        }
        this.setState({ matchedTags: foundTags });
      });
    } catch (error) {
      throw new Error("setMatchedTags: error:" + error);
    }
  };

  static getDerivedStateFromProps = (
    props: IMpgTagsComponentProps,
    state: IMpgTagsCompenentState
  ) => {
    state = {
      ...state,
      items: props.items,
      currentItem: props.currentItem,
      existingTagRels: props.currentItem.tagRels,
    };
    return state;
  };
}
export default withTheme(MpgTagsComponent);
