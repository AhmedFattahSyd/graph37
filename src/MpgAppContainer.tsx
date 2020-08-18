import { connect } from "react-redux";
import { loadDataAction, unloadDataAction } from "./redux";
import MpgApp from "./MpgApp";

const mapStateToProps = (state: any) => ({
  dataLoaded: state.dataLoaded,
});

const mapDispatchToProps = {
  loadDataAction,
  unloadDataAction,
};

const AppContainer = connect(mapStateToProps, mapDispatchToProps)(MpgApp);

export default AppContainer;
