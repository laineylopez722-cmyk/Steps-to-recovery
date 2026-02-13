"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var react_native_1 = require("@testing-library/react-native");
var react_native_2 = require("react-native");
jest.mock('../../design-system/context/ThemeContext', function () { return ({
    ThemeContext: {
        Consumer: function (_a) {
            var children = _a.children;
            return children(null);
        },
        Provider: function (_a) {
            var children = _a.children;
            return children;
        },
    },
}); });
// Mock React.useContext to return null for ThemeContext (uses FALLBACK_COLORS)
var originalUseContext = react_1.default.useContext;
var useContextSpy = jest.spyOn(react_1.default, 'useContext').mockImplementation(function (context) {
    if (context && context.Consumer) {
        return null;
    }
    return originalUseContext(context);
});
jest.mock('@expo/vector-icons', function () { return ({
    MaterialIcons: 'MaterialIcons',
}); });
jest.mock('../../utils/logger', function () { return ({
    logger: {
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
    },
}); });
jest.mock('../../lib/sentry', function () { return ({
    captureException: jest.fn(),
}); });
var ErrorBoundary_1 = require("../ErrorBoundary");
global.__DEV__ = true;
function ThrowingChild(_a) {
    var shouldThrow = _a.shouldThrow;
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <react_native_2.Text>Normal content</react_native_2.Text>;
}
describe('ErrorBoundary', function () {
    var consoleErrorSpy;
    beforeEach(function () {
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(function () { });
    });
    afterEach(function () {
        consoleErrorSpy.mockRestore();
    });
    afterAll(function () {
        useContextSpy.mockRestore();
    });
    it('renders children when no error occurs', function () {
        var getByText = (0, react_native_1.render)(<ErrorBoundary_1.ErrorBoundary>
        <ThrowingChild shouldThrow={false}/>
      </ErrorBoundary_1.ErrorBoundary>).getByText;
        expect(getByText('Normal content')).toBeTruthy();
    });
    it('renders fallback UI when a child throws', function () {
        var getByText = (0, react_native_1.render)(<ErrorBoundary_1.ErrorBoundary>
        <ThrowingChild shouldThrow={true}/>
      </ErrorBoundary_1.ErrorBoundary>).getByText;
        expect(getByText('Something unexpected happened')).toBeTruthy();
        expect(getByText('Try Again')).toBeTruthy();
    });
    it('calls onReset when try again is pressed', function () {
        var onReset = jest.fn();
        var getByText = (0, react_native_1.render)(<ErrorBoundary_1.ErrorBoundary onReset={onReset}>
        <ThrowingChild shouldThrow={true}/>
      </ErrorBoundary_1.ErrorBoundary>).getByText;
        react_native_1.fireEvent.press(getByText('Try Again'));
        expect(onReset).toHaveBeenCalledTimes(1);
    });
    it('uses a custom fallback when provided', function () {
        var getByText = (0, react_native_1.render)(<ErrorBoundary_1.ErrorBoundary fallback={<react_native_2.View>
            <react_native_2.Text>Custom fallback</react_native_2.Text>
          </react_native_2.View>}>
        <ThrowingChild shouldThrow={true}/>
      </ErrorBoundary_1.ErrorBoundary>).getByText;
        expect(getByText('Custom fallback')).toBeTruthy();
    });
});
